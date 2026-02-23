import { clampSteeringAngle, gaussianLogProbability, randomGaussian } from '../policyGradientCar/policyGradientCarMath.js';
import { NeuralNetwork } from './ppoFigure8Network.js';

export const PPO_HYPERPARAMS = {
  gamma: 0.99,
  lambda: 0.95,
  clip_epsilon: 0.2,
  learning_rate_actor: 0.0003,
  learning_rate_critic: 0.001,
  entropy_coeff: 0.01,
  epochs_per_update: 4,
  minibatch_size: 64,
  gradient_clip_max_norm: 0.5,
  learning_rate_decay: 0.9999,
  learning_rate_floor: 1e-5
};

export function normalizeAdvantages(values) {
  if (!values.length) return [];
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(Math.max(1e-8, variance));
  return values.map((v) => (v - mean) / std);
}

export function computeGAE(rewards, values, gamma, lambda) {
  const advantages = Array.from({ length: rewards.length }, () => 0);
  let gae = 0;
  for (let t = rewards.length - 1; t >= 0; t -= 1) {
    const nextValue = t === rewards.length - 1 ? 0 : values[t + 1];
    const delta = rewards[t] + gamma * nextValue - values[t];
    gae = delta + gamma * lambda * gae;
    advantages[t] = gae;
  }
  const returns = advantages.map((a, i) => a + values[i]);
  return { advantages, returns };
}

export function computeClippedObjective(advantage, ratio, clipEpsilon) {
  const clippedRatio = Math.max(1 - clipEpsilon, Math.min(1 + clipEpsilon, ratio));
  return Math.min(ratio * advantage, clippedRatio * advantage);
}

export class PPOAgent {
  constructor(config = {}) {
    this.config = { ...PPO_HYPERPARAMS, ...config };
    this.actor = new NeuralNetwork([6, 16, 8, 2]);
    this.critic = new NeuralNetwork([6, 32, 16, 1]);
    this.episode = [];
    this.lastAdvantageMean = 0;
  }

  selectAction(state, inferenceOnly = false) {
    const forward = this.actor.forward(state);
    const mu = forward.output[0];
    const logSigma = Math.max(-3, Math.min(2, forward.output[1]));
    const sigma = Math.exp(logSigma);
    const sampled = inferenceOnly ? mu : randomGaussian(mu, sigma);
    const action = clampSteeringAngle(sampled);
    const logProb = gaussianLogProbability(action, mu, sigma);
    const value = this.critic.forward(state).output[0];
    return { action, mu, logSigma, sigma, logProb, value };
  }

  storeTransition(state, actionData, reward) {
    this.episode.push({ state: [...state], reward, ...actionData });
  }

  endEpisode() {
    if (!this.episode.length) return { loss: 0, valueLoss: 0, transitionCount: 0, advantageMean: 0 };

    const rewards = this.episode.map((s) => s.reward);
    const values = this.episode.map((s) => s.value);
    const { advantages, returns } = computeGAE(rewards, values, this.config.gamma, this.config.lambda);
    this.lastAdvantageMean = advantages.reduce((sum, v) => sum + v, 0) / Math.max(1, advantages.length);
    const normalizedAdvantages = normalizeAdvantages(advantages);

    const N = this.episode.length;
    for (let epoch = 0; epoch < this.config.epochs_per_update; epoch += 1) {
      for (let start = 0; start < N; start += this.config.minibatch_size) {
        const end = Math.min(N, start + this.config.minibatch_size);
        const actorGrad = this.actor.createGradientBuffer();
        const criticGrad = this.critic.createGradientBuffer();

        for (let i = start; i < end; i += 1) {
          const step = this.episode[i];
          const actorForward = this.actor.forward(step.state);
          const mu = actorForward.output[0];
          const logSigma = Math.max(-3, Math.min(2, actorForward.output[1]));
          const sigma = Math.exp(logSigma);
          const newLogProb = gaussianLogProbability(step.action, mu, sigma);
          const ratio = Math.exp(newLogProb - step.logProb);
          const adv = normalizedAdvantages[i];
          const objective = computeClippedObjective(adv, ratio, this.config.clip_epsilon);
          const unclipped = ratio * adv;
          const activeUnclipped = objective === unclipped;

          let dLossDLogp = 0;
          if (activeUnclipped) dLossDLogp = -adv * ratio;
          const dLogpDMu = (step.action - mu) / (sigma * sigma);
          const dLogpDLogSigma = -1 + ((step.action - mu) ** 2) / (sigma * sigma);
          const dMu = dLossDLogp * dLogpDMu;
          const dLogSigma = dLossDLogp * dLogpDLogSigma - this.config.entropy_coeff;
          this.actor.accumulateGradients(actorForward.cache, [dMu, dLogSigma], actorGrad);

          const criticForward = this.critic.forward(step.state);
          const valueErrorGrad = 2 * (criticForward.output[0] - returns[i]);
          this.critic.accumulateGradients(criticForward.cache, [valueErrorGrad], criticGrad);
        }

        this.actor.clipGradients(actorGrad, this.config.gradient_clip_max_norm);
        this.critic.clipGradients(criticGrad, this.config.gradient_clip_max_norm);
        this.actor.updateWeights(actorGrad, this.config.learning_rate_actor, end - start);
        this.critic.updateWeights(criticGrad, this.config.learning_rate_critic, end - start);
      }
    }

    this.config.learning_rate_actor = Math.max(this.config.learning_rate_floor, this.config.learning_rate_actor * this.config.learning_rate_decay);
    this.config.learning_rate_critic = Math.max(this.config.learning_rate_floor, this.config.learning_rate_critic * this.config.learning_rate_decay);
    this.config.entropy_coeff = Math.max(0.001, this.config.entropy_coeff * 0.999);

    const transitionCount = this.episode.length;
    this.episode = [];
    return { transitionCount, advantageMean: this.lastAdvantageMean };
  }
}

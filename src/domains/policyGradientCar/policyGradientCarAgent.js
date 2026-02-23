import {
  clampSteeringAngle,
  discountedReturns,
  gaussianLogProbability,
  randomGaussian
} from './policyGradientCarMath.js';
import { NeuralNetwork } from './policyGradientCarNetwork.js';

export class PolicyGradientAgent {
  constructor({ gamma = 0.99, learningRate = 0.001 } = {}) {
    this.gamma = gamma;
    this.learningRate = learningRate;
    this.network = new NeuralNetwork();
    this.episode = [];
    this.lastLoss = 0;
  }

  selectAction(state, inferenceOnly = false) {
    const forward = this.network.forward(state);
    const sampledAction = clampSteeringAngle(randomGaussian(forward.mu, forward.sigma));

    return {
      action: sampledAction,
      mu: forward.mu,
      sigma: forward.sigma,
      cache: forward.cache,
      logSigma: forward.logSigma,
      output: forward.output,
      inferenceOnly
    };
  }

  storeTransition(state, actionData, reward) {
    this.episode.push({
      state: [...state],
      action: actionData.action,
      reward,
      mu: actionData.mu,
      sigma: actionData.sigma,
      cache: actionData.cache
    });
  }

  endEpisode() {
    if (!this.episode.length) {
      this.lastLoss = 0;
      return { returns: [], loss: 0, transitionCount: 0 };
    }

    const rewards = this.episode.map((step) => step.reward);
    const returns = discountedReturns(rewards, this.gamma);

    let loss = 0;
    for (let i = 0; i < this.episode.length; i += 1) {
      const step = this.episode[i];
      step.discountedReturn = returns[i];
      const logProb = gaussianLogProbability(step.action, step.mu, step.sigma);
      loss += -logProb * returns[i];
    }

    const gradients = this.network.computeGradients(this.episode);
    this.network.updateWeights(gradients, this.learningRate, this.episode.length);

    this.lastLoss = loss / this.episode.length;
    const transitionCount = this.episode.length;
    this.episode = [];

    return {
      returns,
      loss: this.lastLoss,
      transitionCount
    };
  }
}

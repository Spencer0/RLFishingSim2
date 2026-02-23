import { PPOAgent } from './ppoFigure8Agent.js';
import { CarEnvironment } from './ppoFigure8Environment.js';
import { pickCriticMood } from './ppoFigure8Visualization.js';

export class PPOFigure8Simulation {
  constructor() {
    this.mode = 'ppo-figure-8';
    this.environment = new CarEnvironment();
    this.agent = new PPOAgent();
    this.episode = 1;
    this.timestep = 0;
    this.consecutiveLaps = 0;
    this.trainingComplete = false;
    this.currentState = this.environment.reset();
    this.lastEpisodeValues = [];
    this.crashHistory = [];

    this.state = {
      mode: this.mode,
      day: 1,
      minute: 0,
      fishInventory: 1,
      coins: 0,
      isPlaying: true,
      log: ['PPO Figure-8 started.'],
      car: { ...this.environment.car },
      track: {
        leftCenter: this.environment.leftCenter,
        rightCenter: this.environment.rightCenter,
        outerRadiusX: this.environment.outerRadiusX,
        outerRadiusY: this.environment.outerRadiusY,
        innerRadiusX: this.environment.innerRadiusX,
        innerRadiusY: this.environment.innerRadiusY,
        corridor: this.environment.corridor
      },
      policy: {
        episode: 1,
        consecutiveLaps: 0,
        lastMu: 0,
        lastSigma: 1,
        lastAction: 0,
        actorLr: this.agent.config.learning_rate_actor,
        criticLr: this.agent.config.learning_rate_critic,
        clipEpsilon: this.agent.config.clip_epsilon,
        lastAdvantageMean: 0,
        entropyCoeff: this.agent.config.entropy_coeff,
        lastEpisodeValues: [],
        criticSpeech: 'Looking good out there!',
        bubbleAlpha: 1
      },
      trainingComplete: false,
      agent: this.agent
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick() {
    if (!this.state.isPlaying) return;
    const actionData = this.agent.selectAction(this.currentState, this.trainingComplete);
    const transition = this.environment.step(actionData.action);
    if (!this.trainingComplete) this.agent.storeTransition(this.currentState, actionData, transition.reward);
    this.currentState = transition.nextState;
    this.timestep += 1;
    this.state.minute += 1;
    this.state.car = { ...this.environment.car };
    this.state.policy.lastMu = actionData.mu;
    this.state.policy.lastSigma = actionData.sigma;
    this.state.policy.lastAction = actionData.action;
    this.lastEpisodeValues.push(actionData.value);

    if (transition.done) {
      const crashed = transition.event === 'crash';
      this.crashHistory.push(crashed ? 1 : 0);
      this.crashHistory = this.crashHistory.slice(-50);
      if (!crashed) this.consecutiveLaps += 1;
      else this.consecutiveLaps = 0;

      const update = this.trainingComplete ? { advantageMean: 0 } : this.agent.endEpisode();
      this.state.policy.lastAdvantageMean = update.advantageMean ?? 0;
      this.state.policy.actorLr = this.agent.config.learning_rate_actor;
      this.state.policy.criticLr = this.agent.config.learning_rate_critic;
      this.state.policy.entropyCoeff = this.agent.config.entropy_coeff;
      this.state.policy.lastEpisodeValues = [...this.lastEpisodeValues];
      this.lastEpisodeValues = [];

      if (this.episode % 10 === 0) {
        const values = this.state.policy.lastEpisodeValues;
        const trend = values.length > 1 ? values.at(-1) - values[0] : 0;
        const crashRate = this.crashHistory.reduce((a, b) => a + b, 0) / Math.max(1, this.crashHistory.length);
        this.state.policy.criticSpeech = pickCriticMood({ valueTrend: trend, advantageMean: this.state.policy.lastAdvantageMean, crashRate, consecutiveLaps: this.consecutiveLaps });
        this.state.policy.bubbleAlpha = 0.35;
      } else {
        this.state.policy.bubbleAlpha = Math.min(1, (this.state.policy.bubbleAlpha ?? 1) + 0.05);
      }

      if (this.consecutiveLaps >= 50) this.trainingComplete = true;
      this.state.trainingComplete = this.trainingComplete;
      this.state.policy.consecutiveLaps = this.consecutiveLaps;
      this.state.log.unshift(`Episode ${this.episode}: ${transition.event} · adv μ ${this.state.policy.lastAdvantageMean.toFixed(3)}`);
      this.state.log = this.state.log.slice(0, 16);
      this.episode += 1;
      this.state.day = this.episode;
      this.state.fishInventory = this.episode;
      this.state.policy.episode = this.episode;
      this.timestep = 0;
      this.currentState = this.environment.reset();
      this.state.car = { ...this.environment.car };
    }
  }
}

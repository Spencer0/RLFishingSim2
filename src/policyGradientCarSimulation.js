import { PolicyGradientAgent } from './policyGradientCarAgent.js';
import { CarEnvironment } from './policyGradientCarEnvironment.js';

export class PolicyGradientCarSimulation {
  constructor() {
    this.environment = new CarEnvironment();
    this.agent = new PolicyGradientAgent();
    this.mode = 'policy-gradient-car';
    this.episode = 1;
    this.timestep = 0;
    this.consecutiveCompletions = 0;
    this.trainingComplete = false;
    this.lossHistory = [];
    this.currentState = this.environment.reset();
    this.lastReturn = 0;

    this.state = {
      mode: this.mode,
      day: 1,
      minute: 0,
      fishInventory: 0,
      coins: 0,
      isPlaying: true,
      log: ['Policy Gradient Car simulation started.'],
      policy: {
        episode: this.episode,
        timestep: this.timestep,
        consecutiveCompletions: this.consecutiveCompletions,
        lastMu: 0,
        lastSigma: 1,
        lastAction: 0,
        lastReturn: 0,
        lastLoss: 0,
        lossHistory: this.lossHistory
      },
      car: { ...this.environment.car },
      track: {
        center: { ...this.environment.trackCenter },
        outerRadiusX: this.environment.outerRadiusX,
        outerRadiusY: this.environment.outerRadiusY,
        innerRadiusX: this.environment.innerRadiusX,
        innerRadiusY: this.environment.innerRadiusY,
        fireTires: this.environment.fireTires.map((tire) => ({ ...tire }))
      },
      trainingComplete: false
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick() {
    if (!this.state.isPlaying) return;

    const actionData = this.agent.selectAction(this.currentState, this.trainingComplete);
    const transition = this.environment.step(actionData.action);

    if (!this.trainingComplete) {
      this.agent.storeTransition(this.currentState, actionData, transition.reward);
    }
    this.currentState = transition.nextState;
    this.timestep += 1;

    this.state.minute += 1;
    this.state.car = { ...this.environment.car };
    this.state.policy.lastMu = actionData.mu;
    this.state.policy.lastSigma = actionData.sigma;
    this.state.policy.lastAction = actionData.action;
    this.state.policy.timestep = this.timestep;

    if (transition.done) {
      if (transition.event === 'finish') {
        this.consecutiveCompletions += 1;
        this.state.log.unshift(`Episode ${this.episode}: finish +1.`);
      } else {
        this.consecutiveCompletions = 0;
        this.state.log.unshift(`Episode ${this.episode}: crash -1.`);
      }

      const result = this.trainingComplete ? { returns: [0], loss: this.state.policy.lastLoss } : this.agent.endEpisode();
      this.lastReturn = result.returns[0] ?? 0;
      this.state.policy.lastReturn = this.lastReturn;
      this.state.policy.lastLoss = result.loss ?? this.state.policy.lastLoss;
      this.lossHistory.push(this.state.policy.lastLoss);
      this.lossHistory.splice(0, Math.max(0, this.lossHistory.length - 80));

      if (this.consecutiveCompletions >= 3) {
        this.trainingComplete = true;
      }

      this.episode += 1;
      this.timestep = 0;
      this.currentState = this.environment.reset();
      this.state.car = { ...this.environment.car };
      this.state.day = this.episode;
    }

    this.state.policy.episode = this.episode;
    this.state.policy.consecutiveCompletions = this.consecutiveCompletions;
    this.state.policy.lossHistory = this.lossHistory;
    this.state.trainingComplete = this.trainingComplete;
    this.state.log = this.state.log.slice(0, 16);
  }
}

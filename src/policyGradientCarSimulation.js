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
    this.totalCompletions = 0;
    this.trainingComplete = false;
    this.lossHistory = [];
    this.currentState = this.environment.reset();
    this.lastReturn = 0;

    this.state = {
      mode: this.mode,
      day: 1,
      minute: 0,
      fishInventory: 1,
      coins: 0,
      isPlaying: true,
      log: ['Policy Gradient Car simulation started.'],
      policy: {
        episode: this.episode,
        totalCompletions: this.totalCompletions,
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

    this.pendingEpisodeEnd = null;
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  getDeploymentSnapshot() {
    return {
      mode: this.mode,
      network: this.agent.network.toSnapshot()
    };
  }


  tick() {
    if (!this.state.isPlaying) return;

    if (this.pendingEpisodeEnd) {
      this.state.minute += 1;
      this.pendingEpisodeEnd.explosionFrames = Math.max(0, this.pendingEpisodeEnd.explosionFrames - 1);
      this.state.carCrashFrame = this.pendingEpisodeEnd.explosionFrames;
      if (this.pendingEpisodeEnd.explosionFrames === 0) {
        this.finalizeEpisodeReset();
      }
      return;
    }

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
    this.state.carCrashFrame = 0;

    if (transition.done) {
      const completedLap = transition.event === 'finish';
      this.consecutiveCompletions = completedLap ? this.consecutiveCompletions + 1 : 0;
      if (completedLap) this.totalCompletions += 1;

      const result = this.trainingComplete ? { returns: [0], loss: this.state.policy.lastLoss } : this.agent.endEpisode();
      this.lastReturn = result.returns[0] ?? 0;
      this.state.policy.lastReturn = this.lastReturn;
      this.state.policy.lastLoss = result.loss ?? this.state.policy.lastLoss;
      this.lossHistory.push(this.state.policy.lastLoss);
      this.lossHistory.splice(0, Math.max(0, this.lossHistory.length - 80));

      if (this.consecutiveCompletions >= 100) {
        this.trainingComplete = true;
      }

      this.state.log.unshift(this.composeJournalEntry({
        completedLap,
        actionData,
        transition,
        loss: this.state.policy.lastLoss,
        returns: this.lastReturn
      }));

      if (completedLap) {
        this.finalizeEpisodeReset();
      } else {
        this.pendingEpisodeEnd = { explosionFrames: 2 };
        this.state.carCrashFrame = this.pendingEpisodeEnd.explosionFrames;
      }

      this.state.fishInventory = this.episode;
      this.state.policy.totalCompletions = this.totalCompletions;
      this.state.policy.consecutiveCompletions = this.consecutiveCompletions;
      this.state.policy.lossHistory = this.lossHistory;
      this.state.trainingComplete = this.trainingComplete;
      this.state.log = this.state.log.slice(0, 16);
      return;
    }

    this.state.policy.episode = this.episode;
    this.state.fishInventory = this.episode;
    this.state.policy.totalCompletions = this.totalCompletions;
    this.state.policy.consecutiveCompletions = this.consecutiveCompletions;
    this.state.policy.lossHistory = this.lossHistory;
    this.state.trainingComplete = this.trainingComplete;
    this.state.log = this.state.log.slice(0, 16);
  }

  finalizeEpisodeReset() {
    this.episode += 1;
    this.timestep = 0;
    this.currentState = this.environment.reset();
    this.state.car = { ...this.environment.car };
    this.state.day = this.episode;
    this.pendingEpisodeEnd = null;
    this.state.carCrashFrame = 0;
    this.state.policy.episode = this.episode;
    this.state.fishInventory = this.episode;
    this.state.policy.totalCompletions = this.totalCompletions;
  }

  composeJournalEntry({ completedLap, actionData, transition, loss, returns }) {
    const drift = Math.abs(actionData.action - actionData.mu);
    const confidence = actionData.sigma < 0.6 ? 'locked in' : (actionData.sigma < 1.2 ? 'steady' : 'exploratory');
    const driverLine = completedLap
      ? `I kept the line clean and crossed the finish with a smooth ${actionData.action.toFixed(2)}° steer.`
      : `I overcooked that corner and kissed the barrier after a ${actionData.action.toFixed(2)}° twitch.`;
    return `Attempt ${this.episode}: ${driverLine} Insight → μ ${actionData.mu.toFixed(2)}°, σ ${actionData.sigma.toFixed(2)} (${confidence}), action drift ${drift.toFixed(2)}°, reward ${transition.reward.toFixed(2)}, return ${returns.toFixed(2)}, loss ${loss.toFixed(4)}.`;
  }
}

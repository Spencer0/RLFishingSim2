import { PolicyGradientAgent } from './policyGradientCarAgent.js';
import { CarEnvironment } from './policyGradientCarEnvironment.js';

export const DEPLOYMENT_LANES = 10;
export const DEPLOYMENT_EPISODES_PER_LANE = 100;
export const DEPLOYMENT_SIMULATION_SPEED = 10;

export class DeploymentLaneRunner {
  constructor({
    id,
    episodesTarget = DEPLOYMENT_EPISODES_PER_LANE,
    maxTicksPerEpisode = 220,
    networkSnapshot,
    environmentFactory = () => new CarEnvironment()
  }) {
    this.id = id;
    this.episodesTarget = episodesTarget;
    this.maxTicksPerEpisode = maxTicksPerEpisode;
    this.environmentFactory = environmentFactory;

    this.agent = new PolicyGradientAgent();
    if (networkSnapshot) {
      this.agent.network.loadSnapshot(networkSnapshot);
    }

    this.completedEpisodes = 0;
    this.successes = 0;
    this.totalReward = 0;
    this.done = false;
    this.currentEpisodeTicks = 0;
    this.currentState = null;
    this.lastTransition = null;
    this.resetEpisode();
  }

  resetEpisode() {
    const environment = this.environmentFactory();
    this.environment = environment;
    this.currentState = environment.reset();
    this.currentEpisodeTicks = 0;
    this.lastTransition = {
      event: 'running',
      done: false,
      reward: 0,
      car: { ...environment.car },
      track: {
        center: { ...environment.trackCenter },
        outerRadiusX: environment.outerRadiusX,
        outerRadiusY: environment.outerRadiusY,
        innerRadiusX: environment.innerRadiusX,
        innerRadiusY: environment.innerRadiusY,
        fireTires: environment.fireTires.map((tire) => ({ ...tire }))
      }
    };
  }

  runTicks(tickCount = 1) {
    if (this.done) return;

    for (let step = 0; step < tickCount; step += 1) {
      if (this.done) break;

      const actionData = this.agent.selectAction(this.currentState, true);
      const transition = this.environment.step(actionData.action);
      this.currentState = transition.nextState;
      this.currentEpisodeTicks += 1;
      this.totalReward += transition.reward;
      this.lastTransition = {
        event: transition.event,
        done: transition.done,
        reward: transition.reward,
        car: { ...this.environment.car },
        track: {
          center: { ...this.environment.trackCenter },
          outerRadiusX: this.environment.outerRadiusX,
          outerRadiusY: this.environment.outerRadiusY,
          innerRadiusX: this.environment.innerRadiusX,
          innerRadiusY: this.environment.innerRadiusY,
          fireTires: this.environment.fireTires.map((tire) => ({ ...tire }))
        }
      };

      const forcedDone = this.currentEpisodeTicks >= this.maxTicksPerEpisode;
      if (transition.done || forcedDone) {
        this.completedEpisodes += 1;
        if (transition.event === 'finish') this.successes += 1;

        if (this.completedEpisodes >= this.episodesTarget) {
          this.done = true;
          break;
        }

        this.resetEpisode();
      }
    }
  }

  getProgress() {
    return {
      id: this.id,
      completedEpisodes: this.completedEpisodes,
      episodesTarget: this.episodesTarget,
      successes: this.successes,
      totalReward: this.totalReward,
      done: this.done,
      transition: this.lastTransition
    };
  }
}

export function createDeploymentScore(runnerProgress, episodesPerLane = DEPLOYMENT_EPISODES_PER_LANE) {
  const maxScore = runnerProgress.length * episodesPerLane;
  const score = runnerProgress.reduce((sum, lane) => sum + lane.successes, 0);
  return {
    score,
    maxScore
  };
}

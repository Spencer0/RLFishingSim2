import { describe, expect, it } from 'vitest';
import {
  DeploymentLaneRunner,
  createDeploymentScore
} from '../src/policyDeployment.js';

class StubEnvironment {
  constructor(outcomes) {
    this.outcomes = outcomes;
    this.index = 0;
    this.car = { x: 0, y: 0, headingDeg: 0 };
    this.trackCenter = { x: 0, y: 0 };
    this.outerRadiusX = 1;
    this.outerRadiusY = 1;
    this.innerRadiusX = 1;
    this.innerRadiusY = 1;
    this.fireTires = [];
  }

  reset() {
    return [0, 0, 0, 0];
  }

  step() {
    const outcome = this.outcomes[this.index] ?? { done: false, event: 'running', reward: 0 };
    this.index += 1;
    return {
      ...outcome,
      nextState: [0, 0, 0, 0]
    };
  }
}

describe('DeploymentLaneRunner', () => {
  it('tracks successes and completes target episodes', () => {
    const runner = new DeploymentLaneRunner({
      id: 1,
      episodesTarget: 3,
      environmentFactory: () => new StubEnvironment([
        { done: true, event: 'finish', reward: 1 },
        { done: true, event: 'crash', reward: -1 },
        { done: true, event: 'finish', reward: 1 }
      ])
    });

    runner.runTicks(3);
    const progress = runner.getProgress();

    expect(progress.completedEpisodes).toBe(3);
    expect(progress.successes).toBe(3);
    expect(progress.done).toBe(true);
  });
});

describe('createDeploymentScore', () => {
  it('computes aggregate score and max score', () => {
    const score = createDeploymentScore([
      { successes: 88 },
      { successes: 92 }
    ], 100);

    expect(score).toEqual({ score: 180, maxScore: 200 });
  });
});

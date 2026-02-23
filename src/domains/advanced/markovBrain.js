import { chooseEpsilonGreedyAction, computeTemporalDifferenceUpdatedQValue } from '../../shared/rl/qLearning.js';

const ACTIONS = ['lake', 'river', 'ocean'];

export class TabularMarkovBrain {
  constructor(options) {
    this.epsilon = options.epsilon ?? 0.15;
    this.alpha = options.alpha ?? 0.25;
    this.gamma = options.gamma ?? 0.9;
    this.qTable = {};
    this.totalReward = 0;
  }

  ensureState(stateKey) {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = { lake: 0, river: 0, ocean: 0 };
    }
  }

  chooseAction(stateKey, randomValue = Math.random()) {
    this.ensureState(stateKey);
    return chooseEpsilonGreedyAction({
      actionValuesByName: this.qTable[stateKey],
      actionNames: ACTIONS,
      explorationRate: this.epsilon,
      randomValue
    });
  }

  update(stateKey, action, reward, nextStateKey) {
    this.ensureState(stateKey);
    this.ensureState(nextStateKey);
    const currentQ = this.qTable[stateKey][action];
    const maxNextQ = Math.max(...ACTIONS.map((candidateAction) => this.qTable[nextStateKey][candidateAction]));
    const updatedQ = computeTemporalDifferenceUpdatedQValue({
      currentQValue: currentQ,
      rewardValue: reward,
      learningRate: this.alpha,
      discountFactor: this.gamma,
      maxNextQValue: maxNextQ
    });
    this.qTable[stateKey][action] = updatedQ;
    this.totalReward += reward;
  }

  snapshot() {
    return {
      epsilon: this.epsilon,
      alpha: this.alpha,
      gamma: this.gamma,
      totalReward: this.totalReward,
      visitedStates: Object.keys(this.qTable).length,
      qTable: this.qTable
    };
  }
}

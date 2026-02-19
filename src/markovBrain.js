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
    if (randomValue < this.epsilon) {
      const index = Math.floor((randomValue / this.epsilon) * ACTIONS.length);
      return ACTIONS[Math.min(index, ACTIONS.length - 1)];
    }

    return ACTIONS.reduce((bestAction, currentAction) => (
      this.qTable[stateKey][currentAction] > this.qTable[stateKey][bestAction] ? currentAction : bestAction
    ), ACTIONS[0]);
  }

  update(stateKey, action, reward, nextStateKey) {
    this.ensureState(stateKey);
    this.ensureState(nextStateKey);
    const currentQ = this.qTable[stateKey][action];
    const maxNextQ = Math.max(...ACTIONS.map((candidateAction) => this.qTable[nextStateKey][candidateAction]));
    const updatedQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
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

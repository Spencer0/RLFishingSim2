const ACTIONS = ['hunt', 'fish', 'trade', 'raid'];

function bucketFood(food) {
  if (food < 35) return 'low';
  if (food < 80) return 'medium';
  return 'high';
}

export class TribalBrain {
  constructor(name, options = {}) {
    this.name = name;
    this.epsilon = options.epsilon ?? 0.2;
    this.alpha = options.alpha ?? 0.2;
    this.gamma = options.gamma ?? 0.88;
    this.qTable = {};
    this.totalReward = 0;
    this.actionHistory = [];
    this.stateVisits = {};
  }

  buildStateKey(ownFood, otherLastAction, forestStock, riverStock) {
    return `${bucketFood(ownFood)}_${otherLastAction}_${forestStock}_${riverStock}`;
  }

  ensureState(stateKey) {
    if (!this.qTable[stateKey]) {
      this.qTable[stateKey] = { hunt: 0, fish: 0, trade: 0, raid: 0 };
    }
    this.stateVisits[stateKey] = this.stateVisits[stateKey] ?? 0;
  }

  chooseAction(stateKey) {
    this.ensureState(stateKey);
    this.stateVisits[stateKey] += 1;

    if (Math.random() < this.epsilon) {
      return ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
    }

    return ACTIONS.reduce((bestAction, action) => (
      this.qTable[stateKey][action] > this.qTable[stateKey][bestAction] ? action : bestAction
    ), ACTIONS[0]);
  }

  update(stateKey, action, reward, nextStateKey) {
    this.ensureState(stateKey);
    this.ensureState(nextStateKey);
    const currentQ = this.qTable[stateKey][action];
    const maxNextQ = Math.max(...ACTIONS.map((nextAction) => this.qTable[nextStateKey][nextAction]));
    const updatedQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ - currentQ);
    this.qTable[stateKey][action] = updatedQ;
    this.totalReward += reward;
  }

  recordAction(action) {
    this.actionHistory.push(action);
    if (this.actionHistory.length > 20) {
      this.actionHistory.shift();
    }
  }

  getBestAction(stateKey) {
    this.ensureState(stateKey);
    return ACTIONS.reduce((bestAction, action) => (
      this.qTable[stateKey][action] > this.qTable[stateKey][bestAction] ? action : bestAction
    ), ACTIONS[0]);
  }

  snapshot() {
    return {
      epsilon: this.epsilon,
      alpha: this.alpha,
      gamma: this.gamma,
      totalReward: this.totalReward,
      qTable: this.qTable,
      visitedStates: Object.keys(this.qTable).length,
      stateVisits: this.stateVisits,
      actionHistory: [...this.actionHistory]
    };
  }
}

export { ACTIONS as TRIBAL_ACTIONS, bucketFood };

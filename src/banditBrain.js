export class EpsilonGreedyBandit {
  constructor(options) {
    this.epsilon = options.epsilon;
    const initialValue = options.initialValue ?? 0;
    this.qValues = { lake: initialValue, river: initialValue };
    this.visits = { lake: 0, river: 0 };
    this.totalReward = 0;
  }

  chooseSpot(rand = Math.random()) {
    if (rand < this.epsilon) {
      return rand < this.epsilon / 2 ? 'lake' : 'river';
    }
    return this.qValues.lake >= this.qValues.river ? 'lake' : 'river';
  }

  update(spot, reward) {
    this.visits[spot] += 1;
    const n = this.visits[spot];
    const old = this.qValues[spot];
    this.qValues[spot] = old + (reward - old) / n;
    this.totalReward += reward;
  }

  snapshot() {
    return {
      qValues: { ...this.qValues },
      visits: { ...this.visits },
      epsilon: this.epsilon,
      totalReward: this.totalReward
    };
  }
}

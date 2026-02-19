export class EpsilonGreedyBandit {
  constructor(options) {
    this.epsilon = options.epsilon;
    const initialValue = options.initialValue ?? 0;
    this.qValues = { lake: initialValue, river: initialValue, ocean: initialValue };
    this.visits = { lake: 0, river: 0, ocean: 0 };
    this.totalReward = 0;
  }

  chooseSpot(availableSpots = ['lake', 'river'], rand = Math.random()) {
    if (availableSpots.length === 0) return 'lake';

    if (rand < this.epsilon) {
      const index = Math.floor((rand / this.epsilon) * availableSpots.length);
      return availableSpots[Math.min(index, availableSpots.length - 1)];
    }

    return availableSpots.reduce((best, spot) => (
      this.qValues[spot] > this.qValues[best] ? spot : best
    ), availableSpots[0]);
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

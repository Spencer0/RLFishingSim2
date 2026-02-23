import { chooseEpsilonGreedyAction } from '../../shared/rl/qLearning.js';

export class EpsilonGreedyBandit {
  constructor(options) {
    this.epsilon = options.epsilon;
    const initialValue = options.initialValue ?? 0;
    this.qValues = { lake: initialValue, river: initialValue, ocean: initialValue };
    this.visits = { lake: 0, river: 0, ocean: 0 };
    this.totalReward = 0;
  }

  chooseSpot(availableSpots = ['lake', 'river'], randomValue = Math.random()) {
    if (availableSpots.length === 0) return 'lake';

    return chooseEpsilonGreedyAction({
      actionValuesByName: this.qValues,
      actionNames: availableSpots,
      explorationRate: this.epsilon,
      randomValue
    });
  }

  update(spot, reward) {
    this.visits[spot] += 1;
    const visitCount = this.visits[spot];
    const previousQValue = this.qValues[spot];
    this.qValues[spot] = previousQValue + (reward - previousQValue) / visitCount;
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

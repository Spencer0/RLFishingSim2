import { chooseEpsilonGreedyAction, computeTemporalDifferenceUpdatedQValue } from '../../shared/rl/qLearning.js';

const HABITATS = ['wetland', 'forest', 'savanna'];
const STATES = ['low', 'medium', 'high'];
const ACTIONS = HABITATS;

export const OBS_MODEL = {
  low: { low: 0.7, medium: 0.2, high: 0.1 },
  medium: { low: 0.2, medium: 0.6, high: 0.2 },
  high: { low: 0.1, medium: 0.25, high: 0.65 }
};

export const TRANSITION = {
  low: { low: 0.7, medium: 0.25, high: 0.05 },
  medium: { low: 0.2, medium: 0.6, high: 0.2 },
  high: { low: 0.05, medium: 0.3, high: 0.65 }
};

function normalizeDistribution(distribution) {
  const total = Object.values(distribution).reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    const fallback = 1 / STATES.length;
    return { low: fallback, medium: fallback, high: fallback };
  }

  return STATES.reduce((result, state) => {
    result[state] = distribution[state] / total;
    return result;
  }, {});
}

export function dominantBelief(distribution) {
  return STATES.reduce((best, candidate) => (distribution[candidate] > distribution[best] ? candidate : best), STATES[0]);
}

export function sampleFromDistribution(distribution, randomValue = Math.random()) {
  let cursor = 0;
  for (const state of STATES) {
    cursor += distribution[state] ?? 0;
    if (randomValue <= cursor) return state;
  }
  return STATES[STATES.length - 1];
}

export function sampleObservation(trueState, randomValue = Math.random()) {
  return sampleFromDistribution(OBS_MODEL[trueState], randomValue);
}

export class POMDPBrain {
  constructor(options = {}) {
    this.epsilon = options.epsilon ?? 0.2;
    this.alpha = options.alpha ?? 0.2;
    this.gamma = options.gamma ?? 0.88;
    this.qTable = {};
    this.totalReward = 0;
    this.belief = {
      wetland: { low: 0.33, medium: 0.34, high: 0.33 },
      forest: { low: 0.33, medium: 0.34, high: 0.33 },
      savanna: { low: 0.33, medium: 0.34, high: 0.33 }
    };
  }

  ensureState(stateKey) {
    if (!this.qTable[stateKey]) this.qTable[stateKey] = { wetland: 0, forest: 0, savanna: 0 };
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
    const maxNextQ = Math.max(...ACTIONS.map((candidate) => this.qTable[nextStateKey][candidate]));
    this.qTable[stateKey][action] = computeTemporalDifferenceUpdatedQValue({
      currentQValue: currentQ,
      rewardValue: reward,
      learningRate: this.alpha,
      discountFactor: this.gamma,
      maxNextQValue: maxNextQ
    });
    this.totalReward += reward;
  }

  updateBelief(habitat, observedSignal) {
    const prior = this.belief[habitat];
    const posterior = {};
    let normalization = 0;

    for (const trueState of STATES) {
      posterior[trueState] = OBS_MODEL[trueState][observedSignal] * prior[trueState];
      normalization += posterior[trueState];
    }

    this.belief[habitat] = normalizeDistribution(posterior);
  }

  propagateBeliefThroughTransition(habitat) {
    const prior = this.belief[habitat];
    const predicted = { low: 0, medium: 0, high: 0 };

    for (const sourceState of STATES) {
      for (const targetState of STATES) {
        predicted[targetState] += prior[sourceState] * TRANSITION[sourceState][targetState];
      }
    }

    this.belief[habitat] = normalizeDistribution(predicted);
  }

  beliefKey() {
    return HABITATS.map((habitat) => dominantBelief(this.belief[habitat])[0]).join('');
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

import { describe, expect, it } from 'vitest';
import { EpsilonGreedyBandit } from '../src/domains/simple/banditBrain.js';

describe('EpsilonGreedyBandit', () => {
  it('chooses best action when not exploring', () => {
    const brain = new EpsilonGreedyBandit({ epsilon: 0 });
    brain.update('river', 10);
    expect(brain.chooseSpot(['lake', 'river'], 0.9)).toBe('river');
  });

  it('updates Q value as incremental average', () => {
    const brain = new EpsilonGreedyBandit({ epsilon: 0 });
    brain.update('lake', 6);
    brain.update('lake', 10);
    const snapshot = brain.snapshot();
    expect(snapshot.qValues.lake).toBe(8);
    expect(snapshot.visits.lake).toBe(2);
    expect(snapshot.totalReward).toBe(16);
  });

  it('can select ocean when available and it has best value', () => {
    const brain = new EpsilonGreedyBandit({ epsilon: 0 });
    brain.update('ocean', 30);
    expect(brain.chooseSpot(['lake', 'river', 'ocean'], 0.9)).toBe('ocean');
  });
});

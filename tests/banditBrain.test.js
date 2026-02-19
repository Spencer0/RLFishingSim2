import { describe, expect, it } from 'vitest';
import { EpsilonGreedyBandit } from '../src/banditBrain.js';

describe('EpsilonGreedyBandit', () => {
  it('chooses best action when not exploring', () => {
    const brain = new EpsilonGreedyBandit({ epsilon: 0 });
    brain.update('river', 10);
    expect(brain.chooseSpot(0.9)).toBe('river');
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
});

import { describe, expect, it } from 'vitest';
import { TabularMarkovBrain } from '../src/domains/advanced/markovBrain.js';

describe('TabularMarkovBrain', () => {
  it('initializes and updates q values for state-action transitions', () => {
    const brain = new TabularMarkovBrain({ epsilon: 0, alpha: 0.5, gamma: 0.9 });
    brain.update('hhh', 'ocean', 12, 'mhh');
    const snapshot = brain.snapshot();
    expect(snapshot.qTable.hhh.ocean).toBeGreaterThan(0);
    expect(snapshot.visitedStates).toBe(2);
  });

  it('chooses best action in exploitation mode', () => {
    const brain = new TabularMarkovBrain({ epsilon: 0 });
    brain.update('hhh', 'ocean', 20, 'hhh');
    expect(brain.chooseAction('hhh', 0.9)).toBe('ocean');
  });
});

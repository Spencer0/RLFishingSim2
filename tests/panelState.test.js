import { describe, expect, it } from 'vitest';
import { buildPanelRenderKey } from '../src/panelState.js';

describe('buildPanelRenderKey', () => {
  it('changes in simple mode when displayed stats change', () => {
    const base = {
      mode: 'simple',
      day: 1,
      minute: 360,
      fishInventory: 2,
      coins: 10,
      hasBoat: false,
      isPlaying: true,
      brain: { epsilon: 0.2, qValues: { lake: 1, river: 2, ocean: 0 }, visits: { lake: 1, river: 1, ocean: 0 }, totalReward: 10 },
      log: ['a', 'b']
    };

    const keyA = buildPanelRenderKey(base);
    const keyB = buildPanelRenderKey({ ...base, coins: 11 });

    expect(keyA).not.toBe(keyB);
  });

  it('changes in advanced mode when q-table data changes', () => {
    const base = {
      mode: 'advanced',
      day: 1,
      minute: 360,
      fishInventory: 2,
      coins: 10,
      isPlaying: true,
      stockLevels: { lake: 'high', river: 'medium', ocean: 'low' },
      replenishTimers: {
        lake: { pendingLevels: 0, actionsUntilReplenish: 0 },
        river: { pendingLevels: 0, actionsUntilReplenish: 0 },
        ocean: { pendingLevels: 0, actionsUntilReplenish: 0 }
      },
      brain: {
        epsilon: 0.2,
        alpha: 0.4,
        gamma: 0.8,
        visitedStates: 2,
        totalReward: 12,
        qTable: { hml: { lake: 1, river: 2, ocean: 3 } }
      },
      log: ['a', 'b']
    };

    const keyA = buildPanelRenderKey(base);
    const keyB = buildPanelRenderKey({
      ...base,
      brain: { ...base.brain, qTable: { hml: { lake: 4, river: 2, ocean: 3 } } }
    });

    expect(keyA).not.toBe(keyB);
  });

  it('builds specialized keys for policy-gradient-car, tribal, and pomdp', () => {
    const policyGradientKey = buildPanelRenderKey({
      mode: 'policy-gradient-car',
      day: 2,
      minute: 32,
      isPlaying: true,
      trainingComplete: false,
      car: { x: 1 },
      policy: { episode: 2 },
      log: ['entry']
    });

    const tribalKey = buildPanelRenderKey({
      mode: 'tribal',
      day: 7,
      phase: 'dawn',
      forestStock: 12,
      riverStock: 8,
      ashvari: { food: 2 },
      duskborn: { food: 3 },
      jointHistory: ['AA'],
      log: ['tribal']
    });

    const pomdpKey = buildPanelRenderKey({
      mode: 'pomdp',
      day: 4,
      minute: 40,
      fishInventory: 3,
      coins: 15,
      isPlaying: false,
      truePrevalence: { wetland: 'low', forest: 'high', savanna: 'medium' },
      belief: { wetland: {}, forest: {}, savanna: {} },
      beliefKey: 'lhm',
      lastObservations: { wetland: 'low', forest: 'high', savanna: 'medium' },
      transitionTimers: {},
      daysSinceLastVisit: {},
      brain: { epsilon: 0.1 },
      log: ['pomdp']
    });

    expect(policyGradientKey).toContain('trainingComplete');
    expect(tribalKey).toContain('jointHistory');
    expect(pomdpKey).toContain('beliefKey');
  });
});

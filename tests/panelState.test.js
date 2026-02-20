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
        lake: { pendingLevels: 0, daysUntilReplenish: 0 },
        river: { pendingLevels: 0, daysUntilReplenish: 0 },
        ocean: { pendingLevels: 0, daysUntilReplenish: 0 }
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
});

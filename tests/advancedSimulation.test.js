import { describe, expect, it } from 'vitest';
import { AdvancedFishingSimulation } from '../src/advancedSimulation.js';

describe('AdvancedFishingSimulation', () => {
  it('reduces stock and schedules replenishment when fishing', () => {
    const simulation = new AdvancedFishingSimulation();
    simulation.consumeStock('lake');
    const state = simulation.getState();
    expect(state.stockLevels.lake).toBe('medium');
    expect(state.replenishTimers.lake.pendingLevels).toBe(1);
    expect(state.replenishTimers.lake.daysUntilReplenish).toBe(2);
  });

  it('replenishes one stock level every two days', () => {
    const simulation = new AdvancedFishingSimulation();
    simulation.consumeStock('lake'); // high -> medium
    simulation.consumeStock('lake'); // medium -> low

    simulation.applyDailyReplenishment();
    expect(simulation.getState().stockLevels.lake).toBe('low');
    simulation.applyDailyReplenishment();
    expect(simulation.getState().stockLevels.lake).toBe('medium');
    simulation.applyDailyReplenishment();
    simulation.applyDailyReplenishment();
    expect(simulation.getState().stockLevels.lake).toBe('high');
  });
});

import { describe, expect, it } from 'vitest';
import { AdvancedFishingSimulation } from '../src/advancedSimulation.js';

describe('AdvancedFishingSimulation', () => {
  it('reduces stock and schedules replenishment steps for actions on other spots', () => {
    const simulation = new AdvancedFishingSimulation();
    simulation.consumeStock('lake');
    const state = simulation.getState();
    expect(state.stockLevels.lake).toBe('medium');
    expect(state.replenishTimers.lake.pendingLevels).toBe(1);
    expect(state.replenishTimers.lake.actionsUntilReplenish).toBe(2);
  });

  it('replenishes one stock level after two fishing actions on other spots', () => {
    const simulation = new AdvancedFishingSimulation();
    simulation.consumeStock('lake'); // high -> medium
    simulation.consumeStock('lake'); // medium -> low

    simulation.consumeStock('river');
    expect(simulation.getState().stockLevels.lake).toBe('low');

    simulation.consumeStock('ocean');
    expect(simulation.getState().stockLevels.lake).toBe('medium');

    simulation.consumeStock('river');
    simulation.consumeStock('ocean');
    expect(simulation.getState().stockLevels.lake).toBe('high');
  });

  it('does not let a location self-replenish from its own fishing action', () => {
    const simulation = new AdvancedFishingSimulation();
    simulation.consumeStock('lake'); // high -> medium and lake starts pending regrowth
    simulation.consumeStock('lake'); // medium -> low and no external actions yet

    expect(simulation.getState().stockLevels.lake).toBe('low');

    simulation.consumeStock('river');
    expect(simulation.getState().stockLevels.lake).toBe('low');

    simulation.consumeStock('river');
    expect(simulation.getState().stockLevels.lake).toBe('medium');
  });


  it('computes compact state keys from stock levels', () => {
    const simulation = new AdvancedFishingSimulation();
    const state = simulation.getState();
    state.stockLevels = { lake: 'low', river: 'medium', ocean: 'high' };

    expect(simulation.computeStateKey()).toBe('lmh');
  });

});

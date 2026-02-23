import { describe, expect, it, vi } from 'vitest';
import { AdvancedFishingSimulation } from '../src/domains/advanced/advancedSimulation.js';

describe('AdvancedFishingSimulation reward attribution', () => {
  it('updates Q-values immediately on each fishing action and not during selling', () => {
    const simulation = new AdvancedFishingSimulation();
    const updateSpy = vi.spyOn(simulation.brain, 'update');

    simulation.phase = 'fishing';
    simulation.destination = 'ocean';
    simulation.currentStateKey = 'hhh';
    simulation.state.fishInventory = 13;
    simulation.performFishing = () => ({ fishCaught: 1, coinsPerFish: 3, totalCoins: 3 });

    simulation.tick();

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledWith('hhh', 'ocean', 3, 'hhm');
    expect(simulation.currentStateKey).toBe('hhm');

    simulation.phase = 'selling';
    simulation.state.fishInventory = 4;
    simulation.tick();

    expect(updateSpy).toHaveBeenCalledTimes(1);
  });
});

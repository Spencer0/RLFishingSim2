import { FishingSimulation as SimpleFishingSimulation } from './simulation.js';
import { AdvancedFishingSimulation } from './advancedSimulation.js';

export class SimulationCatalog {
  constructor(entries = {}) {
    this.entries = { ...entries };
  }

  register(mode, config) {
    this.entries[mode] = config;
  }

  get(mode) {
    return this.entries[mode] ?? null;
  }

  listModes() {
    return Object.keys(this.entries);
  }
}

export function createDefaultSimulationCatalog() {
  const catalog = new SimulationCatalog();
  catalog.register('simple', {
    label: 'Simple',
    subtitle: 'Epsilon-greedy day planning: lake vs river vs ocean (boat unlock)',
    hasStockPanel: false,
    createSimulation: () => new SimpleFishingSimulation()
  });
  catalog.register('advanced', {
    label: 'Advanced',
    subtitle: 'Q-table over stock states (3^3) with replenishment dynamics',
    hasStockPanel: true,
    createSimulation: () => new AdvancedFishingSimulation()
  });
  return catalog;
}

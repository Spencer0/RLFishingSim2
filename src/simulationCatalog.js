import { FishingSimulation as SimpleFishingSimulation } from './simulation.js';
import { AdvancedFishingSimulation } from './advancedSimulation.js';
import { POMDPSimulation } from './pomdpSimulation.js';

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
    homeEmoji: '🎣',
    homeButtonLabel: 'Simple Markov Simulation',
    titleEmoji: '🎣🐟',
    titleText: 'RL Fishing Simulator',
    inventoryEmoji: '🐟',
    inventoryLabel: 'Catch',
    subtitle: 'Epsilon-greedy day planning: lake vs river vs ocean (boat unlock)',
    hasStockPanel: false,
    createSimulation: () => new SimpleFishingSimulation()
  });
  catalog.register('advanced', {
    label: 'Advanced',
    homeEmoji: '🛥️',
    homeButtonLabel: 'Advanced Markov Simulation',
    titleEmoji: '🎣🛥️',
    titleText: 'RL Fishing Simulator',
    inventoryEmoji: '🐟',
    inventoryLabel: 'Catch',
    subtitle: 'Q-table over stock states (3^3) with replenishment dynamics',
    hasStockPanel: true,
    createSimulation: () => new AdvancedFishingSimulation()
  });
  catalog.register('pomdp', {
    label: 'Wildlife Rescue (POMDP)',
    homeEmoji: '🦌',
    homeButtonLabel: 'Wildlife Disease Response',
    titleEmoji: '🦌💉',
    titleText: 'RL Wildlife Simulator',
    inventoryEmoji: '💊',
    inventoryLabel: 'Cures',
    subtitle: 'Belief-state disease surveillance under partial observability.',
    hasStockPanel: true,
    createSimulation: () => new POMDPSimulation()
  });
  return catalog;
}

import { FishingSimulation as SimpleFishingSimulation } from './domains/simple/simulation.js';
import { AdvancedFishingSimulation } from './domains/advanced/advancedSimulation.js';
import { POMDPSimulation } from './domains/pomdp/pomdpSimulation.js';
import { TribalSimulation } from './domains/tribal/tribalSimulation.js';
import { PolicyGradientCarSimulation } from './domains/policyGradientCar/policyGradientCarSimulation.js';
import { PPOFigure8Simulation } from './domains/ppoFigure8/ppoFigure8Simulation.js';

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


  catalog.register('policy-gradient-car', {
    label: 'Policy Gradient Car',
    homeEmoji: '🚗',
    homeButtonLabel: 'Policy Gradient Car',
    titleEmoji: '🚗📈',
    titleText: 'RL Driving Simulator',
    inventoryEmoji: '🏁',
    inventoryLabel: 'Attempts',
    subtitle: 'REINFORCE with a hand-built neural network and Gaussian steering policy.',
    hasStockPanel: false,
    tabs: [
      { id: 'journalPane', label: '📓 Journal' },
      { id: 'brainPane', label: '🧠 Brain' },
      { id: 'qTablePane', label: '📉 Policy Visualization' },
      { id: 'mathPane', label: '∑ Math' }
    ],
    supportsDeployment: true,
    createSimulation: () => new PolicyGradientCarSimulation()
  });

  catalog.register('ppo-figure-8', {
    label: 'PPO Figure-8',
    homeEmoji: '🏎️',
    homeButtonLabel: 'PPO Figure-8',
    titleEmoji: '🏎️♾️',
    titleText: 'RL Driving Simulator',
    inventoryEmoji: '🏁',
    inventoryLabel: 'Attempts',
    subtitle: 'PPO-Clip with Actor/Critic on a figure-8 track.',
    hasStockPanel: false,
    tabs: [
      { id: 'journalPane', label: '📓 Journal' },
      { id: 'brainPane', label: '🧠 Brain' },
      { id: 'qTablePane', label: '📉 Policy Visualization' },
      { id: 'mathPane', label: '∑ Math' }
    ],
    createSimulation: () => new PPOFigure8Simulation()
  });

  catalog.register('tribal', {
    label: 'Tribal',
    homeEmoji: '⚔️',
    homeButtonLabel: 'Multi-Agent Tribal RL',
    titleEmoji: '⚔️🌲',
    titleText: 'RL Tribal Simulator',
    inventoryEmoji: '🍖',
    inventoryLabel: 'Food',
    subtitle: 'Two tribes learning to hunt, fish, trade, or raid in a shared world.',
    hasStockPanel: false,
    tabs: [
      { id: 'journalPane', label: '📓 Journal' },
      { id: 'brainPane', label: '🧠 Brains' },
      { id: 'payoffPane', label: '⚔️ Payoff' },
      { id: 'qTablePane', label: '🗂️ Q Tables' },
      { id: 'relationsPane', label: '🤝 Relations' },
      { id: 'strategyPane', label: '📈 Strategy' },
      { id: 'mathPane', label: '∑ Math' }
    ],
    createSimulation: () => new TribalSimulation()
  });

  return catalog;
}

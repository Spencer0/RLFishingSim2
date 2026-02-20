import { describe, expect, it } from 'vitest';
import { SimulationCatalog, createDefaultSimulationCatalog } from '../src/simulationCatalog.js';

describe('SimulationCatalog', () => {
  it('registers and retrieves simulation configs', () => {
    const catalog = new SimulationCatalog();
    const config = { label: 'Example', createSimulation: () => ({}) };

    catalog.register('example', config);

    expect(catalog.get('example')).toBe(config);
    expect(catalog.listModes()).toEqual(['example']);
  });

  it('returns null for unknown modes', () => {
    const catalog = new SimulationCatalog();
    expect(catalog.get('missing')).toBeNull();
  });
});


it('includes pomdp mode in default catalog', () => {
  const catalog = createDefaultSimulationCatalog();
  expect(catalog.listModes()).toContain('pomdp');
  expect(catalog.get('pomdp')?.label).toBe('Wildlife Rescue (POMDP)');
  expect(catalog.get('pomdp')?.homeEmoji).toBe('🦌');
  expect(catalog.get('simple')?.titleText).toBe('RL Fishing Simulator');
  expect(catalog.get('advanced')?.homeButtonLabel).toContain('Markov');
});

import { describe, expect, it } from 'vitest';
import { SimulationCatalog } from '../src/simulationCatalog.js';

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

import { describe, expect, it, vi } from 'vitest';
import { POMDPBrain, sampleObservation } from '../src/domains/pomdp/pomdpBrain.js';
import { POMDPSimulation, computeBeliefAccuracy } from '../src/domains/pomdp/pomdpSimulation.js';

describe('POMDP belief machinery', () => {
  it('updates belief with Bayes rule and keeps distribution normalized', () => {
    const brain = new POMDPBrain();
    brain.updateBelief('wetland', 'high');
    const b = brain.belief.wetland;

    expect(b.high).toBeGreaterThan(b.medium);
    expect(b.high).toBeGreaterThan(b.low);
    expect(Math.abs(b.low + b.medium + b.high - 1)).toBeLessThan(0.0001);
  });

  it('widens certainty after transition propagation', () => {
    const brain = new POMDPBrain();
    brain.belief.forest = { low: 0.05, medium: 0.05, high: 0.9 };

    brain.propagateBeliefThroughTransition('forest');

    expect(brain.belief.forest.high).toBeLessThan(0.9);
    expect(Math.abs(Object.values(brain.belief.forest).reduce((a, b) => a + b, 0) - 1)).toBeLessThan(0.0001);
  });

  it('discretizes dominant beliefs to a key', () => {
    const brain = new POMDPBrain();
    brain.belief = {
      wetland: { low: 0.1, medium: 0.2, high: 0.7 },
      forest: { low: 0.6, medium: 0.3, high: 0.1 },
      savanna: { low: 0.2, medium: 0.5, high: 0.3 }
    };

    expect(brain.beliefKey()).toBe('hlm');
  });

  it('samples high observations most often from high true state', () => {
    const counts = { low: 0, medium: 0, high: 0 };
    for (let i = 0; i < 1000; i += 1) counts[sampleObservation('high')] += 1;

    expect(counts.high).toBeGreaterThan(counts.medium);
    expect(counts.high).toBeGreaterThan(counts.low);
  });
});

describe('POMDPSimulation behavior', () => {
  it('updates Q per visit instead of aggregating at sell time', () => {
    const sim = new POMDPSimulation();
    const spy = vi.spyOn(sim.brain, 'update');

    sim.phase = 'sampling';
    sim.destination = 'wetland';
    sim.tick();

    sim.phase = 'sampling';
    sim.destination = 'forest';
    sim.tick();

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('computes belief accuracy count correctly', () => {
    const state = {
      truePrevalence: { wetland: 'high', forest: 'low', savanna: 'medium' },
      belief: {
        wetland: { low: 0.1, medium: 0.2, high: 0.7 },
        forest: { low: 0.7, medium: 0.2, high: 0.1 },
        savanna: { low: 0.5, medium: 0.3, high: 0.2 }
      }
    };

    expect(computeBeliefAccuracy(state)).toBe(2);
  });
});

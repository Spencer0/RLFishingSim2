import { describe, expect, it } from 'vitest';
import { SimulationLoop } from '../src/simulationLoop.js';

describe('SimulationLoop', () => {
  it('ticks simulation and notifies draw + simulation advanced', () => {
    let frameCallback = null;
    const requests = [];

    const simulation = {
      state: { isPlaying: true, mode: 'simple' },
      tickCalls: [],
      getState() { return this.state; },
      tick(minutes) {
        this.tickCalls.push(minutes);
      }
    };

    const loop = new SimulationLoop({
      requestFrame: (cb) => {
        frameCallback = cb;
        requests.push(cb);
        return requests.length;
      },
      cancelFrame: () => {}
    });

    const drawnStates = [];
    const advancedStates = [];

    loop.start({
      getSimulation: () => simulation,
      onDraw: (state) => drawnStates.push(state),
      onSimulationAdvanced: (state) => advancedStates.push(state)
    });

    frameCallback(1000 + 20);

    expect(simulation.tickCalls.length).toBeGreaterThan(0);
    expect(drawnStates).toHaveLength(1);
    expect(advancedStates).toHaveLength(1);
  });

  it('draws without ticking when paused', () => {
    let frameCallback = null;
    const simulation = {
      state: { isPlaying: false, mode: 'simple' },
      tickCalls: 0,
      getState() { return this.state; },
      tick() { this.tickCalls += 1; }
    };

    const loop = new SimulationLoop({
      requestFrame: (cb) => {
        frameCallback = cb;
        return 1;
      },
      cancelFrame: () => {}
    });

    let drawCount = 0;
    let advancedCount = 0;

    loop.start({
      getSimulation: () => simulation,
      onDraw: () => { drawCount += 1; },
      onSimulationAdvanced: () => { advancedCount += 1; }
    });

    frameCallback(1000 + 20);

    expect(simulation.tickCalls).toBe(0);
    expect(drawCount).toBe(1);
    expect(advancedCount).toBe(0);
  });

  it('clamps simulation speed to accepted bounds', () => {
    const loop = new SimulationLoop();

    loop.setSimulationSpeed(500);
    expect(loop.getSimulationSpeed()).toBe(100);

    loop.setSimulationSpeed(0);
    expect(loop.getSimulationSpeed()).toBe(1);

    loop.setSimulationSpeed('25');
    expect(loop.getSimulationSpeed()).toBe(25);

    loop.setSimulationSpeed('not-a-number');
    expect(loop.getSimulationSpeed()).toBe(25);
  });

});

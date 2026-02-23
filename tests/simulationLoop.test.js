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

    loop.setSimulationSpeed(5000);
    expect(loop.getSimulationSpeed()).toBe(1000);

    loop.setSimulationSpeed(0);
    expect(loop.getSimulationSpeed()).toBe(1);

    loop.setSimulationSpeed('25');
    expect(loop.getSimulationSpeed()).toBe(25);

    loop.setSimulationSpeed('not-a-number');
    expect(loop.getSimulationSpeed()).toBe(25);
  });

  it('limits simulation ticking to 60 fps cadence even after long frame gaps', () => {
    let frameCallback = null;
    const simulation = {
      state: { isPlaying: true, mode: 'simple' },
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

    loop.start({
      getSimulation: () => simulation,
      onDraw: () => {},
      onSimulationAdvanced: () => {}
    });

    frameCallback(1000 + 250);
    expect(simulation.tickCalls).toBeGreaterThan(0);

    const firstFrameTicks = simulation.tickCalls;
    frameCallback(1000 + 500);
    const secondFrameTicks = simulation.tickCalls - firstFrameTicks;

    expect(secondFrameTicks).toBeLessThanOrEqual(firstFrameTicks);
  });

  it('exposes minutes-per-second conversion and stops active frame on stop()', () => {
    let cancelledFrameId = null;
    const loop = new SimulationLoop({
      simulationSpeed: 2,
      requestFrame: () => 42,
      cancelFrame: (id) => {
        cancelledFrameId = id;
      }
    });

    expect(loop.getSimulationMinutesPerSecond()).toBe(192);

    loop.start({
      getSimulation: () => ({ getState: () => ({ isPlaying: false }) }),
      onDraw: () => {},
      onSimulationAdvanced: () => {}
    });

    loop.stop();
    expect(cancelledFrameId).toBe(42);
  });

  it('clears frame when simulation is unavailable', () => {
    let frameCallback = null;
    const loop = new SimulationLoop({
      requestFrame: (cb) => {
        frameCallback = cb;
        return 7;
      },
      cancelFrame: () => {}
    });

    loop.start({
      getSimulation: () => null,
      onDraw: () => {},
      onSimulationAdvanced: () => {}
    });

    frameCallback(1010);
    expect(loop.frameId).toBeNull();
  });
});

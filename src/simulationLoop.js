const DEFAULT_TARGET_FPS = 60;
const DEFAULT_SIM_MINUTES_PER_SECOND = 10 / 0.22;

export class SimulationLoop {
  constructor({
    targetFps = DEFAULT_TARGET_FPS,
    simulationMinutesPerSecond = DEFAULT_SIM_MINUTES_PER_SECOND,
    maxElapsedMs = 250,
    requestFrame = (cb) => requestAnimationFrame(cb),
    cancelFrame = (id) => cancelAnimationFrame(id),
    now = () => performance.now()
  } = {}) {
    this.frameMs = 1000 / targetFps;
    this.simulationMinutesPerSecond = simulationMinutesPerSecond;
    this.maxElapsedMs = maxElapsedMs;
    this.requestFrame = requestFrame;
    this.cancelFrame = cancelFrame;
    this.now = now;

    this.frameId = null;
    this.previousFrameTime = 0;
    this.simulationAccumulator = 0;
    this.getSimulation = null;
    this.onDraw = null;
    this.onSimulationAdvanced = null;

    this.handleFrame = this.handleFrame.bind(this);
  }

  start({ getSimulation, onDraw, onSimulationAdvanced }) {
    this.stop();
    this.getSimulation = getSimulation;
    this.onDraw = onDraw;
    this.onSimulationAdvanced = onSimulationAdvanced;
    this.previousFrameTime = this.now();
    this.simulationAccumulator = 0;
    this.frameId = this.requestFrame(this.handleFrame);
  }

  stop() {
    if (this.frameId) {
      this.cancelFrame(this.frameId);
      this.frameId = null;
    }
  }

  handleFrame(timestamp) {
    const simulation = this.getSimulation?.();
    if (!simulation) {
      this.frameId = null;
      return;
    }

    const elapsedMs = Math.min(this.maxElapsedMs, timestamp - this.previousFrameTime);
    this.previousFrameTime = timestamp;

    let didSimulationAdvance = false;
    if (simulation.getState().isPlaying) {
      this.simulationAccumulator += elapsedMs;
      while (this.simulationAccumulator >= this.frameMs) {
        const simulatedMinutes = (this.frameMs / 1000) * this.simulationMinutesPerSecond;
        simulation.tick(simulatedMinutes);
        this.simulationAccumulator -= this.frameMs;
        didSimulationAdvance = true;
      }
    }

    const state = simulation.getState();
    this.onDraw?.(state);
    if (didSimulationAdvance) this.onSimulationAdvanced?.(state);

    this.frameId = this.requestFrame(this.handleFrame);
  }
}

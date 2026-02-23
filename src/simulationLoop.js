const DEFAULT_TARGET_FPS = 60;
const MINUTES_PER_DAY = 16 * 60;
const DEFAULT_SIMULATION_SPEED = 10;
const BASE_MINUTES_PER_SECOND = MINUTES_PER_DAY / 10;
const MAX_SIMULATION_SPEED = 1000;
const SIMULATION_STEP_MS = 1000 / DEFAULT_TARGET_FPS;
const MAX_SIMULATION_STEPS_PER_FRAME = 1;

export class SimulationLoop {
  constructor({
    targetFps = DEFAULT_TARGET_FPS,
    simulationSpeed = DEFAULT_SIMULATION_SPEED,
    maxElapsedMs = 250,
    requestFrame = (cb) => requestAnimationFrame(cb),
    cancelFrame = (id) => cancelAnimationFrame(id),
    now = () => performance.now()
  } = {}) {
    this.frameMs = 1000 / targetFps;
    this.simulationStepMs = SIMULATION_STEP_MS;
    this.simulationSpeed = simulationSpeed;
    this.simulationStepMinutes = 2;
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

  setSimulationSpeed(nextSpeed) {
    const parsedSpeed = Number(nextSpeed);
    if (!Number.isFinite(parsedSpeed)) return;
    this.simulationSpeed = Math.max(1, Math.min(MAX_SIMULATION_SPEED, parsedSpeed));
  }

  getSimulationSpeed() {
    return this.simulationSpeed;
  }

  getSimulationMinutesPerSecond() {
    return BASE_MINUTES_PER_SECOND * this.simulationSpeed;
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
      const stepsToRun = Math.min(
        MAX_SIMULATION_STEPS_PER_FRAME,
        Math.floor(this.simulationAccumulator / this.simulationStepMs)
      );

      for (let step = 0; step < stepsToRun; step += 1) {
        const simulatedMinutesThisFrame = (this.simulationStepMs / 1000) * this.getSimulationMinutesPerSecond();
        let remainingMinutes = simulatedMinutesThisFrame;
        while (remainingMinutes > 0) {
          const tickMinutes = Math.min(this.simulationStepMinutes, remainingMinutes);
          simulation.tick(tickMinutes);
          remainingMinutes -= tickMinutes;
        }
        this.simulationAccumulator -= this.simulationStepMs;
        didSimulationAdvance = true;
      }

      if (this.simulationAccumulator >= this.simulationStepMs) {
        this.simulationAccumulator %= this.simulationStepMs;
      }
    }

    const state = simulation.getState();
    this.onDraw?.(state);
    if (didSimulationAdvance) this.onSimulationAdvanced?.(state, elapsedMs);

    this.frameId = this.requestFrame(this.handleFrame);
  }
}

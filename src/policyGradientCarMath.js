export const MAX_STEER_DEGREES = 30;

export function relu(value) {
  return value > 0 ? value : 0;
}

export function reluDerivative(value) {
  return value > 0 ? 1 : 0;
}

export function xavierLimit(inputSize, outputSize) {
  return Math.sqrt(6 / (inputSize + outputSize));
}

export function createMatrix(rows, cols, init = 0) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => init));
}

export function randomGaussian(mean = 0, stdDev = 1) {
  const u1 = Math.max(Number.EPSILON, Math.random());
  const u2 = Math.random();
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z0 * stdDev;
}

export function clampSteeringAngle(angle) {
  return Math.max(-MAX_STEER_DEGREES, Math.min(MAX_STEER_DEGREES, angle));
}

export function gaussianLogProbability(action, mean, sigma) {
  const safeSigma = Math.max(1e-6, sigma);
  const normalized = (action - mean) / safeSigma;
  return -0.5 * normalized * normalized - Math.log(safeSigma) - 0.5 * Math.log(2 * Math.PI);
}

export function discountedReturns(rewards, gamma = 0.99) {
  const returns = Array.from({ length: rewards.length }, () => 0);
  let running = 0;
  for (let index = rewards.length - 1; index >= 0; index -= 1) {
    running = rewards[index] + gamma * running;
    returns[index] = running;
  }
  return returns;
}

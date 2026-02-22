import {
  createMatrix,
  relu,
  reluDerivative,
  xavierLimit
} from './policyGradientCarMath.js';

const EPSILON = 1e-6;

function initializeLayer(outputSize, inputSize) {
  const limit = xavierLimit(inputSize, outputSize);
  const weights = createMatrix(outputSize, inputSize);
  const biases = Array.from({ length: outputSize }, () => 0);
  for (let row = 0; row < outputSize; row += 1) {
    for (let col = 0; col < inputSize; col += 1) {
      weights[row][col] = (Math.random() * 2 - 1) * limit;
    }
  }
  return { weights, biases };
}

function affineForward(weights, biases, input) {
  const output = Array.from({ length: weights.length }, () => 0);
  for (let row = 0; row < weights.length; row += 1) {
    let sum = biases[row];
    for (let col = 0; col < input.length; col += 1) {
      sum += weights[row][col] * input[col];
    }
    output[row] = sum;
  }
  return output;
}

export class NeuralNetwork {
  constructor() {
    this.layer1 = initializeLayer(16, 4);
    this.layer2 = initializeLayer(8, 16);
    this.layer3 = initializeLayer(2, 8);
  }

  forward(state) {
    const z1 = affineForward(this.layer1.weights, this.layer1.biases, state);
    const a1 = z1.map(relu);
    const z2 = affineForward(this.layer2.weights, this.layer2.biases, a1);
    const a2 = z2.map(relu);
    const z3 = affineForward(this.layer3.weights, this.layer3.biases, a2);
    const mu = z3[0];
    const logSigma = Math.max(-3, Math.min(2, z3[1]));
    const sigma = Math.exp(logSigma) + EPSILON;

    return {
      output: [mu, logSigma],
      mu,
      logSigma,
      sigma,
      cache: { state: [...state], z1, a1, z2, a2, z3 }
    };
  }

  createGradientBuffer() {
    return {
      layer1: { dW: createMatrix(16, 4), dB: Array.from({ length: 16 }, () => 0) },
      layer2: { dW: createMatrix(8, 16), dB: Array.from({ length: 8 }, () => 0) },
      layer3: { dW: createMatrix(2, 8), dB: Array.from({ length: 2 }, () => 0) }
    };
  }

  computeGradients(episode) {
    const gradients = this.createGradientBuffer();

    for (const step of episode) {
      const { cache, action, mu, sigma, discountedReturn } = step;
      if (discountedReturn === 0) continue;

      const dLossDmu = -((action - mu) / (sigma * sigma)) * discountedReturn;
      const dLossDLogSigma = (1 - (((action - mu) * (action - mu)) / (sigma * sigma))) * discountedReturn;
      const dOutput = [dLossDmu, dLossDLogSigma];

      const dA2 = Array.from({ length: 8 }, () => 0);
      for (let out = 0; out < 2; out += 1) {
        gradients.layer3.dB[out] += dOutput[out];
        for (let h = 0; h < 8; h += 1) {
          gradients.layer3.dW[out][h] += dOutput[out] * cache.a2[h];
          dA2[h] += this.layer3.weights[out][h] * dOutput[out];
        }
      }

      const dZ2 = dA2.map((value, index) => value * reluDerivative(cache.z2[index]));
      const dA1 = Array.from({ length: 16 }, () => 0);
      for (let out = 0; out < 8; out += 1) {
        gradients.layer2.dB[out] += dZ2[out];
        for (let h = 0; h < 16; h += 1) {
          gradients.layer2.dW[out][h] += dZ2[out] * cache.a1[h];
          dA1[h] += this.layer2.weights[out][h] * dZ2[out];
        }
      }

      const dZ1 = dA1.map((value, index) => value * reluDerivative(cache.z1[index]));
      for (let out = 0; out < 16; out += 1) {
        gradients.layer1.dB[out] += dZ1[out];
        for (let col = 0; col < 4; col += 1) {
          gradients.layer1.dW[out][col] += dZ1[out] * cache.state[col];
        }
      }
    }

    return gradients;
  }

  updateWeights(gradients, learningRate = 0.001, batchSize = 1) {
    const scale = learningRate / Math.max(1, batchSize);
    const applyLayer = (layerName, outSize, inSize) => {
      for (let out = 0; out < outSize; out += 1) {
        this[layerName].biases[out] -= scale * gradients[layerName].dB[out];
        for (let col = 0; col < inSize; col += 1) {
          this[layerName].weights[out][col] -= scale * gradients[layerName].dW[out][col];
        }
      }
    };

    applyLayer('layer1', 16, 4);
    applyLayer('layer2', 8, 16);
    applyLayer('layer3', 2, 8);
  }
}

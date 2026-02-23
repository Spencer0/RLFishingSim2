import { createMatrix, relu, reluDerivative, xavierLimit } from '../policyGradientCar/policyGradientCarMath.js';

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
    for (let col = 0; col < input.length; col += 1) sum += weights[row][col] * input[col];
    output[row] = sum;
  }
  return output;
}

export class NeuralNetwork {
  constructor(layerSizes) {
    this.layerSizes = layerSizes;
    this.layers = [];
    for (let i = 1; i < layerSizes.length; i += 1) {
      this.layers.push(initializeLayer(layerSizes[i], layerSizes[i - 1]));
    }
  }

  forward(input) {
    const activations = [[...input]];
    const preActivations = [];
    for (let i = 0; i < this.layers.length; i += 1) {
      const z = affineForward(this.layers[i].weights, this.layers[i].biases, activations[i]);
      preActivations.push(z);
      const isOutput = i === this.layers.length - 1;
      activations.push(isOutput ? z : z.map(relu));
    }
    return { output: activations.at(-1), cache: { activations, preActivations } };
  }

  createGradientBuffer() {
    return this.layers.map((layer) => ({
      dW: createMatrix(layer.weights.length, layer.weights[0].length),
      dB: Array.from({ length: layer.biases.length }, () => 0)
    }));
  }

  accumulateGradients(cache, outputGradient, buffer) {
    let upstream = [...outputGradient];
    for (let layerIndex = this.layers.length - 1; layerIndex >= 0; layerIndex -= 1) {
      const layer = this.layers[layerIndex];
      const aPrev = cache.activations[layerIndex];
      const z = cache.preActivations[layerIndex];
      const local = upstream.map((value, idx) => {
        const isOutput = layerIndex === this.layers.length - 1;
        return isOutput ? value : value * reluDerivative(z[idx]);
      });

      const nextUpstream = Array.from({ length: aPrev.length }, () => 0);
      for (let out = 0; out < layer.weights.length; out += 1) {
        buffer[layerIndex].dB[out] += local[out];
        for (let col = 0; col < layer.weights[out].length; col += 1) {
          buffer[layerIndex].dW[out][col] += local[out] * aPrev[col];
          nextUpstream[col] += layer.weights[out][col] * local[out];
        }
      }
      upstream = nextUpstream;
    }
  }

  clipGradients(buffer, maxNorm = 0.5) {
    let normSq = 0;
    for (const layer of buffer) {
      for (const row of layer.dW) for (const value of row) normSq += value * value;
      for (const value of layer.dB) normSq += value * value;
    }
    const norm = Math.sqrt(normSq);
    if (norm <= maxNorm || norm === 0) return;
    const scale = maxNorm / norm;
    for (const layer of buffer) {
      for (let i = 0; i < layer.dW.length; i += 1) {
        for (let j = 0; j < layer.dW[i].length; j += 1) layer.dW[i][j] *= scale;
      }
      for (let i = 0; i < layer.dB.length; i += 1) layer.dB[i] *= scale;
    }
  }

  updateWeights(buffer, learningRate, batchSize = 1) {
    const scale = learningRate / Math.max(1, batchSize);
    for (let layerIndex = 0; layerIndex < this.layers.length; layerIndex += 1) {
      const layer = this.layers[layerIndex];
      for (let out = 0; out < layer.weights.length; out += 1) {
        layer.biases[out] -= scale * buffer[layerIndex].dB[out];
        for (let col = 0; col < layer.weights[out].length; col += 1) {
          layer.weights[out][col] -= scale * buffer[layerIndex].dW[out][col];
        }
      }
    }
  }
}

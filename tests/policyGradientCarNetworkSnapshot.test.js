import { describe, expect, it } from 'vitest';
import { NeuralNetwork } from '../src/domains/policyGradientCar/policyGradientCarNetwork.js';

describe('NeuralNetwork snapshots', () => {
  it('round-trips model weights via snapshot', () => {
    const first = new NeuralNetwork();
    const snapshot = first.toSnapshot();

    first.layer1.weights[0][0] += 1234;

    const second = new NeuralNetwork();
    second.loadSnapshot(snapshot);

    expect(second.layer1.weights[0][0]).toBe(snapshot.layer1.weights[0][0]);
    expect(first.layer1.weights[0][0]).not.toBe(second.layer1.weights[0][0]);
  });
});

import { describe, expect, it } from 'vitest';
import { NeuralNetwork } from '../src/domains/policyGradientCar/policyGradientCarNetwork.js';
import { randomGaussian, discountedReturns, gaussianLogProbability } from '../src/domains/policyGradientCar/policyGradientCarMath.js';
import { CarEnvironment } from '../src/domains/policyGradientCar/policyGradientCarEnvironment.js';
import { PolicyGradientCarSimulation } from '../src/domains/policyGradientCar/policyGradientCarSimulation.js';
import { PolicyGradientAgent } from '../src/domains/policyGradientCar/policyGradientCarAgent.js';

describe('Policy Gradient Car', () => {
  it('forward pass output shape is length 2', () => {
    const network = new NeuralNetwork();
    const forward = network.forward([0.4, 0.4, 0, 0.5]);
    expect(forward.output).toHaveLength(2);
  });

  it('Box-Muller sampling has approximately correct mean and variance', () => {
    const n = 10000;
    const targetMean = 1.5;
    const targetVariance = 4;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const value = randomGaussian(targetMean, 2);
      sum += value;
      sumSq += value * value;
    }
    const mean = sum / n;
    const variance = sumSq / n - mean * mean;

    expect(Math.abs(mean - targetMean)).toBeLessThan(0.1);
    expect(Math.abs(variance - targetVariance)).toBeLessThan(0.2);
  });

  it('discounted returns match expected known sequence', () => {
    const result = discountedReturns([0, 0, -1], 0.99);
    expect(result[0]).toBeCloseTo(-0.9801, 6);
    expect(result[1]).toBeCloseTo(-0.99, 6);
    expect(result[2]).toBeCloseTo(-1, 6);
  });

  it('gaussian log probability matches known input', () => {
    const value = gaussianLogProbability(1, 0, 1);
    expect(value).toBeCloseTo(-1.4189385332, 6);
  });

  it('full episode can run without throwing', () => {
    const simulation = new PolicyGradientCarSimulation();
    expect(() => {
      for (let i = 0; i < 1000; i += 1) {
        simulation.tick();
      }
    }).not.toThrow();
  });

  it('weight update changes at least one weight after nonzero return episode', () => {
    const agent = new PolicyGradientAgent();
    const before = JSON.stringify(agent.network.layer1.weights);
    const state = [0.4, 0.4, 0, 0.5];
    const actionData = agent.selectAction(state);
    agent.storeTransition(state, actionData, 1);
    agent.endEpisode();
    const after = JSON.stringify(agent.network.layer1.weights);
    expect(after).not.toBe(before);
  });

  it('crash detection triggers when car leaves the oval track', () => {
    const environment = new CarEnvironment();
    environment.car.x = environment.trackCenter.x;
    environment.car.y = environment.trackCenter.y;
    const result = environment.step(0);
    expect(result.done).toBe(true);
    expect(result.event).toBe('crash');
    expect(result.reward).toBe(-10);
  });

  it('fire tire collision triggers crash', () => {
    const environment = new CarEnvironment();
    const tire = environment.fireTires[0];
    environment.car.x = tire.x;
    environment.car.y = tire.y;
    const result = environment.step(0);
    expect(result.done).toBe(true);
    expect(result.event).toBe('crash');
    expect(result.reward).toBe(-10);
  });

  it('finish detection triggers after one completed lap', () => {
    const environment = new CarEnvironment();
    environment.angularProgress = Math.PI * 2 - 0.001;
    const result = environment.step(0);
    expect(result.done).toBe(true);
    expect(result.event).toBe('finish');
    expect(result.reward).toBe(1);
  });
});

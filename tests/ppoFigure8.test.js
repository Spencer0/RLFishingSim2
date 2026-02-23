import { describe, expect, it } from 'vitest';
import { NeuralNetwork } from '../src/domains/ppoFigure8/ppoFigure8Network.js';
import { CarEnvironment } from '../src/domains/ppoFigure8/ppoFigure8Environment.js';
import {
  PPOAgent,
  computeGAE,
  computeClippedObjective,
  normalizeAdvantages,
  PPO_HYPERPARAMS
} from '../src/domains/ppoFigure8/ppoFigure8Agent.js';
import { randomGaussian } from '../src/domains/policyGradientCar/policyGradientCarMath.js';
import { PPOFigure8Simulation } from '../src/domains/ppoFigure8/ppoFigure8Simulation.js';
import { pickCriticMood } from '../src/domains/ppoFigure8/ppoFigure8Visualization.js';

describe('PPO Figure-8', () => {
  it('forward pass output shapes for actor and critic', () => {
    const actor = new NeuralNetwork([6, 16, 8, 2]);
    const critic = new NeuralNetwork([6, 32, 16, 1]);
    expect(actor.forward([0.2, 0.3, 0.1, 0.4, 0, 0.5]).output).toHaveLength(2);
    expect(critic.forward([0.2, 0.3, 0.1, 0.4, 0, 0.5]).output).toHaveLength(1);
  });

  it('GAE computation matches expected known values', () => {
    const rewards = [1, 0.5, -0.2];
    const values = [0.4, 0.3, 0.1];
    const { advantages } = computeGAE(rewards, values, 0.99, 0.95);
    expect(advantages[0]).toBeCloseTo(0.9128, 4);
    expect(advantages[1]).toBeCloseTo(0.01685, 4);
    expect(advantages[2]).toBeCloseTo(-0.3, 4);
  });

  it('PPO ratio clipping surrogate objective is computed correctly', () => {
    const oldLog = -0.5;
    const newLog = -0.1;
    const ratio = Math.exp(newLog - oldLog);
    const objective = computeClippedObjective(1.0, ratio, 0.2);
    expect(ratio).toBeGreaterThan(1.2);
    expect(objective).toBeCloseTo(1.2, 6);
  });

  it('advantage normalization gives mean≈0 std≈1', () => {
    const normalized = normalizeAdvantages([1, 2, 3, 4]);
    const mean = normalized.reduce((a, b) => a + b, 0) / normalized.length;
    const variance = normalized.reduce((a, b) => a + (b - mean) ** 2, 0) / normalized.length;
    expect(Math.abs(mean)).toBeLessThan(1e-8);
    expect(Math.abs(Math.sqrt(variance) - 1)).toBeLessThan(1e-8);
  });

  it('Box-Muller sampling stats are close to target', () => {
    const n = 10000;
    let sum = 0;
    let sumSq = 0;
    for (let i = 0; i < n; i += 1) {
      const x = randomGaussian(2, 0.5);
      sum += x;
      sumSq += x * x;
    }
    const mean = sum / n;
    const std = Math.sqrt(sumSq / n - mean * mean);
    expect(Math.abs(mean - 2)).toBeLessThan(0.05);
    expect(Math.abs(std - 0.5)).toBeLessThan(0.05);
  });

  it('gradient clipping constrains norm', () => {
    const net = new NeuralNetwork([6, 4, 2]);
    const buffer = net.createGradientBuffer();
    for (const layer of buffer) {
      for (let i = 0; i < layer.dW.length; i += 1) {
        for (let j = 0; j < layer.dW[i].length; j += 1) layer.dW[i][j] = 100;
      }
      for (let i = 0; i < layer.dB.length; i += 1) layer.dB[i] = 100;
    }
    net.clipGradients(buffer, 0.5);
    let maxAbs = 0;
    for (const layer of buffer) {
      for (const row of layer.dW) for (const v of row) maxAbs = Math.max(maxAbs, Math.abs(v));
      for (const v of layer.dB) maxAbs = Math.max(maxAbs, Math.abs(v));
    }
    expect(maxAbs).toBeLessThanOrEqual(0.5);
  });

  it('figure-8 collision detection handles loops and corridor', () => {
    const env = new CarEnvironment();
    expect(env.isOnTrack(env.leftCenter.x, env.leftCenter.y - env.midRadiusY)).toBe(true);
    expect(env.isOnTrack(10, 10)).toBe(false);
    expect(env.isOnTrack(env.width * 0.5, env.height * 0.5)).toBe(true);
  });

  it('loop transitions from 0 to 1 near crossover', () => {
    const env = new CarEnvironment();
    env.currentLoop = 0;
    env.currentLoopProgress = Math.PI * 1.8;
    env.car.x = env.width * 0.5;
    env.car.y = env.height * 0.5;
    const result = env.step(0);
    expect(result.event === 'loop-complete' || env.currentLoop === 1).toBe(true);
  });

  it('full episode runs without throwing', () => {
    const sim = new PPOFigure8Simulation();
    expect(() => {
      for (let i = 0; i < 2000; i += 1) sim.tick();
    }).not.toThrow();
  });

  it('weight update changes at least one actor weight', () => {
    const agent = new PPOAgent();
    const before = JSON.stringify(agent.actor.layers[0].weights);
    const state = [0.5, 0.5, 0, 0.2, 0, 0.4];
    const actionData = agent.selectAction(state);
    agent.storeTransition(state, actionData, 1);
    agent.endEpisode();
    const after = JSON.stringify(agent.actor.layers[0].weights);
    expect(after).not.toBe(before);
  });

  it('speech bubble chooses expected moods', () => {
    expect(pickCriticMood({ valueTrend: 1, advantageMean: 0.2 })).toBe('Looking good out there!');
    expect(pickCriticMood({ advantageMean: 0.01 })).toBe('Right on track.');
    expect(pickCriticMood({ crashRate: 0.9 })).toBe('Too risky! Slow down!');
    expect(pickCriticMood({ consecutiveLaps: 11 })).toBe('Almost locked in…');
    expect(pickCriticMood({ consecutiveLaps: 41 })).toBe('Don’t blow it now!');
  });

  it('learning rate decays within expected range after 1000 episodes', () => {
    const agent = new PPOAgent();
    const baseA = PPO_HYPERPARAMS.learning_rate_actor;
    const baseC = PPO_HYPERPARAMS.learning_rate_critic;
    for (let i = 0; i < 1000; i += 1) {
      const state = [0.4, 0.3, 0.1, 0.4, 0, 0.3];
      const actionData = agent.selectAction(state);
      agent.storeTransition(state, actionData, 1);
      agent.endEpisode();
    }
    expect(agent.config.learning_rate_actor).toBeLessThan(baseA);
    expect(agent.config.learning_rate_critic).toBeLessThan(baseC);
    expect(agent.config.learning_rate_actor).toBeGreaterThanOrEqual(1e-5);
    expect(agent.config.learning_rate_critic).toBeGreaterThanOrEqual(1e-5);
  });
});

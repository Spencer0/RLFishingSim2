import { describe, expect, it } from 'vitest';
import { TribalSimulation, detectNashEquilibrium, resolveActions } from '../src/domains/tribal/tribalSimulation.js';
import { TribalBrain } from '../src/domains/tribal/tribalBrain.js';

describe('tribal simulation', () => {
  it('resolves trade trade baseline', () => {
    const result = resolveActions('trade', 'trade', 'high', 'high', 0, 0);
    expect(result.rewardA).toBe(16);
    expect(result.rewardB).toBe(16);
  });

  it('resolves raid asymmetry', () => {
    const result = resolveActions('raid', 'trade', 'high', 'high', 0, 0);
    expect(result.rewardA).toBe(14);
    expect(result.rewardB).toBe(-4);
  });

  it('resolves mutual raid as negative', () => {
    const result = resolveActions('raid', 'raid', 'high', 'high', 0, 0);
    expect(result.rewardA).toBeLessThan(0);
    expect(result.rewardB).toBeLessThan(0);
  });

  it('depletes forest on hunt', () => {
    const sim = new TribalSimulation();
    sim.state.forestStock = 'high';
    sim.resolveHunt('ashvari', 'hunt');
    expect(sim.state.forestStock).toBe('medium');
  });

  it('updates reputation for raid then trade', () => {
    const sim = new TribalSimulation();
    sim.state.ashvari.reputation = 0;
    sim.applyReputationChange('ashvari', 'raid', 'hunt');
    expect(sim.state.ashvari.reputation).toBe(-8);
    sim.applyReputationChange('ashvari', 'trade', 'trade');
    expect(sim.state.ashvari.reputation).toBe(-3);
  });

  it('applies trade bonus from reputation', () => {
    const result = resolveActions('trade', 'trade', 'high', 'high', 80, 80);
    expect(result.rewardA).toBeGreaterThan(16);
  });

  it('updates each brain once per day', () => {
    const sim = new TribalSimulation();
    let ash = 0;
    let dusk = 0;
    const oldAsh = sim.ashvari.update.bind(sim.ashvari);
    const oldDusk = sim.duskborn.update.bind(sim.duskborn);
    sim.ashvari.update = (...args) => { ash += 1; oldAsh(...args); };
    sim.duskborn.update = (...args) => { dusk += 1; oldDusk(...args); };
    sim.tick(900);
    expect(ash).toBe(1);
    expect(dusk).toBe(1);
  });


  it('advances day only after scheduled finish window', () => {
    const sim = new TribalSimulation();
    sim.tick(60);
    expect(sim.state.day).toBe(1);
    sim.tick(780);
    expect(sim.state.day).toBe(1);
    sim.tick(120);
    expect(sim.state.day).toBe(2);
  });

  it('moves expedition away from village during outbound phase', () => {
    const sim = new TribalSimulation();
    sim.tick(80);
    const pos = sim.state.expeditions.ashvari.position;
    expect(pos.x).toBeGreaterThan(130);
  });

  it('builds state key with buckets', () => {
    const brain = new TribalBrain('a', {});
    const key = brain.buildStateKey(85, 'raid', 'low', 'high');
    expect(key).toBe('high_raid_low_high');
  });

  it('keeps action history to 20', () => {
    const brain = new TribalBrain('a', {});
    brain.actionHistory = new Array(20).fill('hunt');
    brain.recordAction('trade');
    expect(brain.actionHistory.length).toBe(20);
    expect(brain.actionHistory[19]).toBe('trade');
    expect(brain.actionHistory[0]).toBe('hunt');
  });

  it('detects nash-like lock in', () => {
    const sim = new TribalSimulation();
    sim.state.jointHistory = Array.from({ length: 20 }).map(() => ({ actionA: 'hunt', actionB: 'hunt' }));
    expect(detectNashEquilibrium(sim.state)).toBe('hunt');
  });
});

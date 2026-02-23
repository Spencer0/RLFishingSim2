import { describe, expect, it } from 'vitest';
import { formatStatusReadout } from '../src/simulationPanelController.js';

describe('formatStatusReadout', () => {
  it('renders fishing status for simple mode', () => {
    const status = formatStatusReadout({ mode: 'simple', day: 4, fishInventory: 2, coins: 80 });
    expect(status).toBe('Day 4 · 🐟 2 Catch · Coins 80');
  });

  it('renders cure status for pomdp mode', () => {
    const status = formatStatusReadout({ mode: 'pomdp', day: 9, fishInventory: 5, coins: 220 });
    expect(status).toBe('Day 9 · 💊 5 Cures · Coins 220');
  });

  it('renders attempts and completions for policy gradient car mode', () => {
    const status = formatStatusReadout({
      mode: 'policy-gradient-car',
      day: 12,
      fishInventory: 12,
      coins: 0,
      policy: { totalCompletions: 3 }
    });
    expect(status).toBe('Day 12 · 🏁 12 Attempts · ✅ 3 Completions · Coins 0');
  });

  it('renders lap streaks for ppo figure-8 mode', () => {
    const status = formatStatusReadout({
      mode: 'ppo-figure-8',
      day: 5,
      fishInventory: 18,
      coins: 17,
      policy: { consecutiveLaps: 4 }
    });
    expect(status).toBe('Day 5 · 🏁 18 Attempts · ♾️ 4 Consecutive Laps · Coins 17');
  });

  it('renders tribal status with in-day time and faction food', () => {
    const status = formatStatusReadout({
      mode: 'tribal',
      day: 6,
      minute: 125,
      ashvari: { food: 7 },
      duskborn: { food: 9 }
    });
    expect(status).toBe('Day 6 · 02:05 · 🍖 Ashvari 7 · 🍖 Duskborn 9');
  });
});

import { TabularMarkovBrain } from './markovBrain.js';

const DAY_START = 6 * 60;
const DAY_END = 22 * 60;
const MAX_BAG = 14;
const STOCK_LEVELS = ['low', 'medium', 'high'];
const STOCK_MULTIPLIER = { low: 0.55, medium: 1, high: 1.45 };
const LOCATION_BASE_CATCH = { lake: 6, river: 7, ocean: 10 };

const LOCATIONS = {
  home: { x: 80, y: 380 },
  lake: { x: 240, y: 320 },
  river: { x: 480, y: 220 },
  ocean: { x: 710, y: 320 },
  market: { x: 420, y: 400 }
};

function lowerStock(stockLevel) {
  if (stockLevel === 'high') return 'medium';
  if (stockLevel === 'medium') return 'low';
  return 'low';
}

function higherStock(stockLevel) {
  if (stockLevel === 'low') return 'medium';
  if (stockLevel === 'medium') return 'high';
  return 'high';
}

export class AdvancedFishingSimulation {
  constructor() {
    this.brain = new TabularMarkovBrain({ epsilon: 0.18, alpha: 0.22, gamma: 0.9 });
    this.phase = 'decide';
    this.destination = 'home';
    this.lastChosenSpot = 'lake';
    this.pendingRewardForTransition = 0;
    this.currentStateKey = 'hhh';

    this.state = {
      mode: 'advanced',
      day: 1,
      minute: DAY_START,
      coins: 0,
      fishInventory: 0,
      fishTrips: 0,
      isPlaying: true,
      log: ['Advanced simulation started. I can observe fish stock levels before deciding.'],
      fisherPosition: { ...LOCATIONS.home },
      target: null,
      stockLevels: { lake: 'high', river: 'high', ocean: 'high' },
      replenishTimers: {
        lake: { pendingLevels: 0, actionsUntilReplenish: 0 },
        river: { pendingLevels: 0, actionsUntilReplenish: 0 },
        ocean: { pendingLevels: 0, actionsUntilReplenish: 0 }
      },
      brain: this.brain.snapshot()
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  computeStateKey() {
    const map = { low: 'l', medium: 'm', high: 'h' };
    return `${map[this.state.stockLevels.lake]}${map[this.state.stockLevels.river]}${map[this.state.stockLevels.ocean]}`;
  }

  tick(minutes = 10) {
    if (!this.state.isPlaying) return;
    this.state.minute += minutes;

    if (this.state.minute >= DAY_END && this.phase !== 'returning') {
      this.phase = 'returning';
      this.destination = 'home';
      this.state.target = 'home';
    }

    switch (this.phase) {
      case 'decide': {
        if (this.state.fishTrips >= 2) {
          this.phase = 'returning';
          this.destination = 'home';
          this.state.target = 'home';
          break;
        }

        this.currentStateKey = this.computeStateKey();
        const action = this.brain.chooseAction(this.currentStateKey);
        this.lastChosenSpot = action;
        this.destination = action;
        this.state.target = action;
        this.phase = 'moving';
        this.state.log.unshift(`Stocks ${this.currentStateKey.toUpperCase()} → Choosing ${action}.`);
        break;
      }
      case 'moving':
      case 'returning': {
        const done = this.moveToward(this.destination);
        if (done) {
          if (this.destination === 'market') this.phase = 'selling';
          else if (this.destination === 'home') this.finishDay();
          else this.phase = 'fishing';
        }
        break;
      }
      case 'fishing': {
        const spot = this.destination;
        const result = this.performFishing(spot);
        this.state.fishInventory += result.fishCaught;
        this.pendingRewardForTransition += result.totalCoins;
        this.consumeStock(spot);
        this.state.log.unshift(`At ${spot} (${this.state.stockLevels[spot]} stock), caught ${result.fishCaught} fish worth ${result.totalCoins}.`);

        if (this.state.fishInventory >= MAX_BAG || this.state.minute >= DAY_END - 120) {
          this.phase = 'moving';
          this.destination = 'market';
          this.state.target = 'market';
        } else {
          this.phase = 'decide';
        }
        break;
      }
      case 'selling': {
        const soldFishCount = this.state.fishInventory;
        const coinsEarned = soldFishCount * 3;
        this.state.coins += coinsEarned;
        this.state.fishInventory = 0;

        const nextStateKey = this.computeStateKey();
        this.brain.update(this.currentStateKey, this.lastChosenSpot, this.pendingRewardForTransition, nextStateKey);
        this.pendingRewardForTransition = 0;
        this.state.brain = this.brain.snapshot();

        this.state.fishTrips += 1;
        this.state.log.unshift(`Sold ${soldFishCount} fish for ${coinsEarned} coins. New state ${nextStateKey.toUpperCase()}.`);

        if (this.state.minute < DAY_END - 90 && this.state.fishTrips < 2) {
          this.phase = 'decide';
          this.state.target = null;
        } else {
          this.phase = 'returning';
          this.destination = 'home';
          this.state.target = 'home';
        }
        break;
      }
    }
  }

  consumeStock(spot) {
    const previousLevel = this.state.stockLevels[spot];
    const loweredLevel = lowerStock(previousLevel);
    this.state.stockLevels[spot] = loweredLevel;

    if (previousLevel !== loweredLevel) {
      const timer = this.state.replenishTimers[spot];
      timer.pendingLevels += 1;
      if (timer.actionsUntilReplenish === 0) {
        timer.actionsUntilReplenish = 2;
      }
    }

    this.progressOtherSpotsReplenishment(spot);
  }

  progressOtherSpotsReplenishment(fishedSpot) {
    for (const spot of ['lake', 'river', 'ocean']) {
      if (spot === fishedSpot) continue;

      const timer = this.state.replenishTimers[spot];
      if (timer.pendingLevels <= 0) continue;

      timer.actionsUntilReplenish -= 1;
      if (timer.actionsUntilReplenish <= 0) {
        this.state.stockLevels[spot] = higherStock(this.state.stockLevels[spot]);
        timer.pendingLevels -= 1;
        timer.actionsUntilReplenish = timer.pendingLevels > 0 ? 2 : 0;
      }
    }
  }

  moveToward(destination) {
    const target = LOCATIONS[destination];
    const position = this.state.fisherPosition;
    const deltaX = target.x - position.x;
    const deltaY = target.y - position.y;
    const distance = Math.hypot(deltaX, deltaY);

    if (distance < 12) {
      position.x = target.x;
      position.y = target.y;
      return true;
    }

    position.x += (deltaX / distance) * 18;
    position.y += (deltaY / distance) * 18;
    return false;
  }

  performFishing(spot) {
    const stockLevel = this.state.stockLevels[spot];
    const baseCatch = LOCATION_BASE_CATCH[spot];
    const variation = Math.floor(Math.random() * 4);
    const fishCaught = Math.max(1, Math.floor((baseCatch + variation) * STOCK_MULTIPLIER[stockLevel]));
    const coinsPerFish = 3;
    return { fishCaught, coinsPerFish, totalCoins: fishCaught * coinsPerFish };
  }

  finishDay() {
    const hour = Math.floor(this.state.minute / 60) % 24;
    const minute = this.state.minute % 60;
    this.state.log.unshift(
      `Day ${this.state.day} ended at ${hour}:${String(minute).padStart(2, '0')}. Stocks now ${this.computeStateKey().toUpperCase()}.`
    );
    this.state.day += 1;
    this.state.minute = DAY_START;
    this.state.fishTrips = 0;
    this.phase = 'decide';
    this.destination = 'home';
    this.state.target = null;
  }
}

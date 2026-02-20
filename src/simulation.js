import { EpsilonGreedyBandit } from './banditBrain.js';

const DAY_START = 6 * 60;
const DAY_END = 22 * 60;
const MAX_BAG = 12;
const BOAT_RENT_COST = 100;

const LOCATIONS = {
  home: { x: 80, y: 380 },
  lake: { x: 260, y: 320 },
  river: { x: 520, y: 220 },
  ocean: { x: 730, y: 310 },
  market: { x: 450, y: 400 }
};

export class FishingSimulation {
  constructor() {
    this.brain = new EpsilonGreedyBandit({ epsilon: 0.2 });
    this.phase = 'decide';
    this.fishTrips = 0;
    this.destination = 'home';
    this.lastChosenSpot = 'lake';
    this.state = {
      day: 1,
      minute: DAY_START,
      coins: 0,
      fishInventory: 0,
      hasBoat: false,
      log: ['A new day begins. I need to choose where to fish.'],
      isPlaying: true,
      fisherPosition: { ...LOCATIONS.home },
      target: null,
      brain: this.brain.snapshot()
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick(minutes = 10) {
    if (!this.state.isPlaying) return;
    this.state.minute += minutes;

    if (!this.state.hasBoat && this.state.coins >= BOAT_RENT_COST) {
      this.state.coins -= BOAT_RENT_COST;
      this.state.hasBoat = true;
      this.state.log.unshift(`Rented a sturdy boat for ${BOAT_RENT_COST} coins. The ocean is now open!`);
    }

    if (this.state.minute >= DAY_END && this.phase !== 'returning') {
      this.phase = 'returning';
      this.destination = 'home';
      this.state.target = 'home';
    }

    switch (this.phase) {
      case 'decide': {
        if (this.fishTrips >= 2) {
          this.phase = 'returning';
          this.destination = 'home';
          this.state.target = 'home';
          break;
        }
        const availableSpots = this.state.hasBoat ? ['lake', 'river', 'ocean'] : ['lake', 'river'];
        const choice = this.brain.chooseSpot(availableSpots);
        this.lastChosenSpot = choice;
        this.destination = choice;
        this.state.target = choice;
        this.phase = 'moving';
        this.state.log.unshift(`I will try the ${choice} today.`);
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
        this.state.log.unshift(`At the ${spot}, I caught ${result.fishCaught} fish worth ${result.totalCoins} coins.`);
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
        const sold = this.state.fishInventory;
        const coinsEarned = sold * 3;
        this.state.coins += coinsEarned;
        this.state.fishInventory = 0;
        this.brain.update(this.lastChosenSpot, coinsEarned);
        this.state.brain = this.brain.snapshot();
        this.fishTrips += 1;
        this.state.log.unshift(`Sold ${sold} fish for ${coinsEarned} coins at market.`);
        if (this.state.minute < DAY_END - 90 && this.fishTrips < 2) {
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

  moveToward(destination) {
    const destinationPoint = LOCATIONS[destination];
    const fisherPosition = this.state.fisherPosition;
    const deltaX = destinationPoint.x - fisherPosition.x;
    const deltaY = destinationPoint.y - fisherPosition.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance < 12) {
      fisherPosition.x = destinationPoint.x;
      fisherPosition.y = destinationPoint.y;
      return true;
    }
    fisherPosition.x += (deltaX / distance) * 18;
    fisherPosition.y += (deltaY / distance) * 18;
    return false;
  }

  performFishing(spot) {
    let fishCaught;
    if (spot === 'lake') fishCaught = 4 + Math.floor(Math.random() * 4);
    else if (spot === 'river') fishCaught = 2 + Math.floor(Math.random() * 8);
    else fishCaught = 10 + Math.floor(Math.random() * 8);

    const coinsPerFish = 3;
    return { fishCaught, coinsPerFish, totalCoins: fishCaught * coinsPerFish };
  }

  finishDay() {
    const h = Math.floor(this.state.minute / 60) % 24;
    const m = this.state.minute % 60;
    const strategy = this.state.hasBoat ? 'Ocean runs are paying off' : 'Still learning the shore waters';
    this.state.log.unshift(`Day ${this.state.day}: ${strategy}. Ended with ${this.state.coins} coins at ${h}:${String(m).padStart(2, '0')}.`);
    this.state.day += 1;
    this.state.minute = DAY_START;
    this.fishTrips = 0;
    this.phase = 'decide';
    this.destination = 'home';
    this.state.target = null;
  }
}

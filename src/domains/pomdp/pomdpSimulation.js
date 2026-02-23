import { POMDPBrain, TRANSITION, dominantBelief, sampleFromDistribution, sampleObservation } from './pomdpBrain.js';

const DAY_START = 6 * 60;
const DAY_END = 22 * 60;
const MAX_BAG = 14;
const HABITATS = ['wetland', 'forest', 'savanna'];
const PREVALENCE_MULTIPLIER = { low: 0.5, medium: 1.0, high: 1.6 };
const BASE_POINTS = { wetland: 9, forest: 8, savanna: 10 };

const LOCATIONS = {
  base: { x: 400, y: 430 },
  wetland: { x: 160, y: 200 },
  forest: { x: 400, y: 120 },
  savanna: { x: 640, y: 200 },
  market: { x: 400, y: 320 }
};

function randomTransitionTimer() {
  return 1 + Math.floor(Math.random() * 3);
}

export function computeBeliefAccuracy(state) {
  return HABITATS.reduce((matches, habitat) => {
    const estimated = dominantBelief(state.belief[habitat]);
    return matches + (estimated === state.truePrevalence[habitat] ? 1 : 0);
  }, 0);
}

export class POMDPSimulation {
  constructor() {
    this.brain = new POMDPBrain({ epsilon: 0.2, alpha: 0.2, gamma: 0.88 });
    this.phase = 'decide';
    this.destination = 'base';
    this.currentBeliefKey = this.brain.beliefKey();
    this.lastVisited = new Set();

    this.state = {
      mode: 'pomdp',
      day: 1,
      minute: DAY_START,
      coins: 0,
      fishInventory: 0,
      fishTrips: 0,
      isPlaying: true,
      log: ['POMDP simulation started. I can only infer prevalence from noisy observations.'],
      fisherPosition: { ...LOCATIONS.base },
      target: null,
      truePrevalence: { wetland: 'low', forest: 'medium', savanna: 'high' },
      belief: this.brain.belief,
      beliefKey: this.currentBeliefKey,
      lastObservations: { wetland: null, forest: null, savanna: null },
      daysSinceLastVisit: { wetland: 0, forest: 0, savanna: 0 },
      transitionTimers: {
        wetland: { daysUntilTransition: randomTransitionTimer() },
        forest: { daysUntilTransition: randomTransitionTimer() },
        savanna: { daysUntilTransition: randomTransitionTimer() }
      },
      brain: this.brain.snapshot()
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick(minutes = 10) {
    if (!this.state.isPlaying) return;
    this.state.minute += minutes;

    if (this.state.minute >= DAY_END && this.phase !== 'returning') {
      this.phase = 'returning';
      this.destination = 'base';
      this.state.target = 'base';
    }

    switch (this.phase) {
      case 'decide': {
        if (this.state.fishTrips >= 2) {
          this.phase = 'returning';
          this.destination = 'base';
          this.state.target = 'base';
          break;
        }

        this.currentBeliefKey = this.brain.beliefKey();
        const action = this.brain.chooseAction(this.currentBeliefKey);
        this.destination = action;
        this.state.target = action;
        this.phase = 'moving';
        this.state.log.unshift(`Belief ${this.currentBeliefKey.toUpperCase()} → Visit ${action}.`);
        break;
      }
      case 'moving':
      case 'returning': {
        const done = this.moveToward(this.destination);
        if (done) {
          if (this.destination === 'market') this.phase = 'selling';
          else if (this.destination === 'base') this.finishDay();
          else this.phase = 'sampling';
        }
        break;
      }
      case 'sampling': {
        const habitat = this.destination;
        const trueState = this.state.truePrevalence[habitat];
        const observation = sampleObservation(trueState);
        this.state.lastObservations[habitat] = observation;
        this.lastVisited.add(habitat);
        this.state.daysSinceLastVisit[habitat] = 0;

        this.brain.updateBelief(habitat, observation);
        const reward = this.sampleInterventionReward(habitat, trueState);
        this.state.fishInventory += reward;

        const nextBeliefKey = this.brain.beliefKey();
        this.brain.update(this.currentBeliefKey, habitat, reward, nextBeliefKey);
        this.currentBeliefKey = nextBeliefKey;

        this.state.beliefKey = this.currentBeliefKey;
        this.state.brain = this.brain.snapshot();

        this.state.log.unshift(
          `${habitat}: observed ${observation} signal, true prevalence ${trueState}, earned ${reward} intervention points.`
        );

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
        const points = this.state.fishInventory;
        this.state.coins += points;
        this.state.fishInventory = 0;
        this.state.fishTrips += 1;
        this.state.log.unshift(`Logged ${points} intervention points at base station.`);

        if (this.state.minute < DAY_END - 90 && this.state.fishTrips < 2) {
          this.phase = 'decide';
          this.state.target = null;
        } else {
          this.phase = 'returning';
          this.destination = 'base';
          this.state.target = 'base';
        }
        break;
      }
    }

    this.state.belief = this.brain.belief;
  }

  sampleInterventionReward(habitat, trueState) {
    const base = BASE_POINTS[habitat];
    const variation = Math.floor(Math.random() * 4);
    return Math.max(1, Math.floor((base + variation) * PREVALENCE_MULTIPLIER[trueState]));
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

  applyOvernightTransitions() {
    for (const habitat of HABITATS) {
      this.brain.propagateBeliefThroughTransition(habitat);
      this.state.transitionTimers[habitat].daysUntilTransition -= 1;

      if (this.state.transitionTimers[habitat].daysUntilTransition <= 0) {
        const currentTrue = this.state.truePrevalence[habitat];
        this.state.truePrevalence[habitat] = sampleFromDistribution(TRANSITION[currentTrue]);
        this.state.transitionTimers[habitat].daysUntilTransition = randomTransitionTimer();
      }

      if (this.lastVisited.has(habitat)) this.lastVisited.delete(habitat);
      else this.state.daysSinceLastVisit[habitat] += 1;
    }
  }

  finishDay() {
    this.applyOvernightTransitions();
    this.state.log.unshift(`Day ${this.state.day} complete. Belief key ${this.brain.beliefKey().toUpperCase()} after overnight drift.`);
    this.state.day += 1;
    this.state.minute = DAY_START;
    this.state.fishTrips = 0;
    this.phase = 'decide';
    this.destination = 'base';
    this.state.target = null;
    this.state.beliefKey = this.brain.beliefKey();
    this.state.brain = this.brain.snapshot();
  }
}

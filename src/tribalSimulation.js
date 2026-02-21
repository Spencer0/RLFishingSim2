import { TribalBrain } from './tribalBrain.js';

const STOCK_MULTIPLIER = { low: 0.55, medium: 1.0, high: 1.45 };
const PAYOFF = {
  hunt: { hunt: [10, 10], fish: [10, 8], trade: [10, 10], raid: [4, 14] },
  fish: { hunt: [8, 10], fish: [8, 8], trade: [8, 10], raid: [2, 14] },
  trade: { hunt: [10, 10], fish: [10, 8], trade: [16, 16], raid: [-4, 14] },
  raid: { hunt: [14, 4], fish: [14, 2], trade: [14, -4], raid: [-6, -6] }
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lowerStock(level) { return level === 'high' ? 'medium' : 'low'; }
function higherStock(level) { return level === 'low' ? 'medium' : 'high'; }

export function resolveActions(actionA, actionB, forestStock, riverStock, reputationA, reputationB) {
  let [rewardA, rewardB] = PAYOFF[actionA][actionB];
  const tradeBonus = Math.floor((reputationA + reputationB) / 20);
  if (actionA === 'trade' && actionB === 'trade') {
    rewardA += tradeBonus;
    rewardB += tradeBonus;
  }

  if (actionA === 'hunt') rewardA = Math.floor(rewardA * STOCK_MULTIPLIER[forestStock]);
  if (actionA === 'fish') rewardA = Math.floor(rewardA * STOCK_MULTIPLIER[riverStock]);
  if (actionB === 'hunt') rewardB = Math.floor(rewardB * STOCK_MULTIPLIER[forestStock]);
  if (actionB === 'fish') rewardB = Math.floor(rewardB * STOCK_MULTIPLIER[riverStock]);

  return { rewardA, rewardB, tradeBonus };
}

export function detectNashEquilibrium(state) {
  const recent = state.jointHistory.slice(0, 20);
  if (recent.length < 20) return null;
  const candidates = ['hunt', 'fish', 'trade', 'raid'];
  for (const action of candidates) {
    const bothCount = recent.filter((day) => day.actionA === action && day.actionB === action).length;
    if (bothCount > 14) return action;
  }
  return null;
}

export class TribalSimulation {
  constructor() {
    this.phase = 'decide';
    this.pendingActions = { ashvari: 'hunt', duskborn: 'hunt' };
    this.currentStateKeys = { ashvari: '', duskborn: '' };
    this.foodTrend = { ashvari: [0], duskborn: [0] };

    this.ashvari = new TribalBrain('Ashvari', { epsilon: 0.2, alpha: 0.2, gamma: 0.88 });
    this.duskborn = new TribalBrain('Duskborn', { epsilon: 0.25, alpha: 0.2, gamma: 0.88 });

    this.state = {
      mode: 'tribal',
      isPlaying: true,
      day: 1,
      minute: 0,
      phase: this.phase,
      forestStock: 'high',
      riverStock: 'high',
      replenishTimers: {
        forest: { pendingLevels: 0, actionsUntilReplenish: 0 },
        river: { pendingLevels: 0, actionsUntilReplenish: 0 }
      },
      ashvari: { food: 0, reputation: 0, lastAction: 'hunt', lastReward: 0, currentStateKey: '', brain: this.ashvari.snapshot() },
      duskborn: { food: 0, reputation: 0, lastAction: 'hunt', lastReward: 0, currentStateKey: '', brain: this.duskborn.snapshot() },
      fishInventory: 0,
      coins: 0,
      jointHistory: [],
      foodHistory: { ashvari: [0], duskborn: [0] },
      log: ['Tribal simulation started. Two tribes now learn together in a shared environment.']
    };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick() {
    if (!this.state.isPlaying) return;
    if (this.phase === 'decide') this.decide();
    else if (this.phase === 'resolve') this.resolve();
    else this.finishDay();
    this.state.phase = this.phase;
    this.state.minute += 1;
  }

  decide() {
    this.currentStateKeys.ashvari = this.ashvari.buildStateKey(this.state.ashvari.food, this.state.duskborn.lastAction, this.state.forestStock, this.state.riverStock);
    this.currentStateKeys.duskborn = this.duskborn.buildStateKey(this.state.duskborn.food, this.state.ashvari.lastAction, this.state.forestStock, this.state.riverStock);

    this.pendingActions.ashvari = this.ashvari.chooseAction(this.currentStateKeys.ashvari);
    this.pendingActions.duskborn = this.duskborn.chooseAction(this.currentStateKeys.duskborn);

    this.state.ashvari.currentStateKey = this.currentStateKeys.ashvari;
    this.state.duskborn.currentStateKey = this.currentStateKeys.duskborn;
    this.phase = 'resolve';
  }

  resolve() {
    const actionA = this.pendingActions.ashvari;
    const actionB = this.pendingActions.duskborn;
    const result = resolveActions(actionA, actionB, this.state.forestStock, this.state.riverStock, this.state.ashvari.reputation, this.state.duskborn.reputation);

    this.resolveHunt('ashvari', actionA);
    this.resolveHunt('duskborn', actionB);
    this.resolveFish('ashvari', actionA);
    this.resolveFish('duskborn', actionB);

    this.applyReputationChange('ashvari', actionA, actionB);
    this.applyReputationChange('duskborn', actionB, actionA);

    this.state.ashvari.food = clamp(this.state.ashvari.food + result.rewardA, 0, 9999);
    this.state.duskborn.food = clamp(this.state.duskborn.food + result.rewardB, 0, 9999);
    this.state.ashvari.lastReward = result.rewardA;
    this.state.duskborn.lastReward = result.rewardB;
    this.state.ashvari.lastAction = actionA;
    this.state.duskborn.lastAction = actionB;

    const nextStateA = this.ashvari.buildStateKey(this.state.ashvari.food, actionB, this.state.forestStock, this.state.riverStock);
    const nextStateB = this.duskborn.buildStateKey(this.state.duskborn.food, actionA, this.state.forestStock, this.state.riverStock);

    this.ashvari.update(this.currentStateKeys.ashvari, actionA, result.rewardA, nextStateA);
    this.duskborn.update(this.currentStateKeys.duskborn, actionB, result.rewardB, nextStateB);
    this.ashvari.recordAction(actionA);
    this.duskborn.recordAction(actionB);

    this.state.jointHistory.unshift({
      day: this.state.day,
      actionA,
      actionB,
      rewardA: result.rewardA,
      rewardB: result.rewardB
    });
    this.state.jointHistory = this.state.jointHistory.slice(0, 120);

    this.state.log.unshift(`Day ${this.state.day}: Ashvari ${actionA} (${result.rewardA}), Duskborn ${actionB} (${result.rewardB}).`);

    this.state.ashvari.brain = this.ashvari.snapshot();
    this.state.duskborn.brain = this.duskborn.snapshot();
    this.phase = 'finishDay';
  }

  resolveHunt(tribe, action = this.pendingActions[tribe]) {
    if (action !== 'hunt') return;
    this.state.forestStock = lowerStock(this.state.forestStock);
    const timer = this.state.replenishTimers.forest;
    timer.pendingLevels += 1;
    if (timer.actionsUntilReplenish === 0) timer.actionsUntilReplenish = 2;
  }

  resolveFish(tribe, action = this.pendingActions[tribe]) {
    if (action !== 'fish') return;
    this.state.riverStock = lowerStock(this.state.riverStock);
    const timer = this.state.replenishTimers.river;
    timer.pendingLevels += 1;
    if (timer.actionsUntilReplenish === 0) timer.actionsUntilReplenish = 2;
  }

  applyReputationChange(tribe, ownAction, otherAction = 'hunt') {
    const node = this.state[tribe];
    if (ownAction === 'raid') node.reputation = clamp(node.reputation - 8, -100, 100);
    if (ownAction === 'trade' && otherAction === 'trade') node.reputation = clamp(node.reputation + 5, -100, 100);
  }

  finishDay() {
    this.progressReplenishment('forest');
    this.progressReplenishment('river');

    if (this.state.day >= 500) {
      this.ashvari.epsilon = Math.max(0.05, this.ashvari.epsilon * 0.9995);
      this.duskborn.epsilon = Math.max(0.05, this.duskborn.epsilon * 0.9995);
    }

    this.state.foodHistory.ashvari.unshift(this.state.ashvari.food);
    this.state.foodHistory.duskborn.unshift(this.state.duskborn.food);
    this.state.foodHistory.ashvari = this.state.foodHistory.ashvari.slice(0, 30);
    this.state.foodHistory.duskborn = this.state.foodHistory.duskborn.slice(0, 30);

    this.state.day += 1;
    this.state.ashvari.brain = this.ashvari.snapshot();
    this.state.duskborn.brain = this.duskborn.snapshot();
    this.phase = 'decide';
  }

  progressReplenishment(resource) {
    const timer = this.state.replenishTimers[resource];
    if (timer.pendingLevels <= 0) return;
    timer.actionsUntilReplenish -= 1;
    if (timer.actionsUntilReplenish <= 0) {
      this.state[`${resource}Stock`] = higherStock(this.state[`${resource}Stock`]);
      timer.pendingLevels -= 1;
      timer.actionsUntilReplenish = timer.pendingLevels > 0 ? 2 : 0;
    }
  }
}

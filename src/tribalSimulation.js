import { TribalBrain } from './tribalBrain.js';

const STOCK_MULTIPLIER = { low: 0.55, medium: 1.0, high: 1.45 };
const PAYOFF = {
  hunt: { hunt: [10, 10], fish: [10, 8], trade: [10, 10], raid: [4, 14] },
  fish: { hunt: [8, 10], fish: [8, 8], trade: [8, 10], raid: [2, 14] },
  trade: { hunt: [10, 10], fish: [10, 8], trade: [16, 16], raid: [-4, 14] },
  raid: { hunt: [14, 4], fish: [14, 2], trade: [14, -4], raid: [-6, -6] }
};

const DAY_START = 6 * 60;
const DAY_END = 22 * 60;
const SCHEDULE = {
  decide: 7 * 60,
  resolve: 12 * 60,
  returnHome: 17 * 60,
  finishDay: 21 * 60
};

const WORLD_POINTS = {
  ashvariHome: { x: 130, y: 332 },
  duskbornHome: { x: 650, y: 332 },
  forest: { x: 350, y: 160 },
  river: { x: 420, y: 320 },
  trade: { x: 390, y: 245 },
  raidAshvari: { x: 200, y: 300 },
  raidDuskborn: { x: 580, y: 300 }
};

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
function lowerStock(level) { return level === 'high' ? 'medium' : 'low'; }
function higherStock(level) { return level === 'low' ? 'medium' : 'high'; }

function lerpPoint(from, to, t) {
  return {
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t
  };
}

function getTargetForAction(tribe, action) {
  if (action === 'hunt') return WORLD_POINTS.forest;
  if (action === 'fish') return WORLD_POINTS.river;
  if (action === 'trade') return WORLD_POINTS.trade;
  return tribe === 'ashvari' ? WORLD_POINTS.raidDuskborn : WORLD_POINTS.raidAshvari;
}

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
    this.phase = 'dawn';
    this.pendingActions = { ashvari: 'hunt', duskborn: 'hunt' };
    this.currentStateKeys = { ashvari: '', duskborn: '' };

    this.ashvari = new TribalBrain('Ashvari', { epsilon: 0.2, alpha: 0.2, gamma: 0.88 });
    this.duskborn = new TribalBrain('Duskborn', { epsilon: 0.25, alpha: 0.2, gamma: 0.88 });

    this.state = {
      mode: 'tribal',
      isPlaying: true,
      day: 1,
      minute: DAY_START,
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
      expeditions: {
        ashvari: this.createExpedition('ashvari', WORLD_POINTS.ashvariHome),
        duskborn: this.createExpedition('duskborn', WORLD_POINTS.duskbornHome)
      },
      log: ['Tribal simulation started. Two tribes now learn together in a shared environment.']
    };
  }

  createExpedition(tribe, home) {
    return { tribe, action: 'hunt', from: { ...home }, to: { ...home }, position: { ...home }, travel: 'idle' };
  }

  getState() { return this.state; }
  togglePlay() { this.state.isPlaying = !this.state.isPlaying; }

  tick(minutes = 10) {
    if (!this.state.isPlaying) return;
    const previousMinute = this.state.minute;
    this.state.minute = Math.min(DAY_END, this.state.minute + minutes);

    if (previousMinute < SCHEDULE.decide && this.state.minute >= SCHEDULE.decide) this.decide();
    if (previousMinute < SCHEDULE.resolve && this.state.minute >= SCHEDULE.resolve) this.resolve();
    if (previousMinute < SCHEDULE.returnHome && this.state.minute >= SCHEDULE.returnHome) this.beginReturn();
    if (previousMinute < SCHEDULE.finishDay && this.state.minute >= SCHEDULE.finishDay) this.finishDay();

    this.updateExpeditionPositions();
    this.state.phase = this.phase;
  }

  decide() {
    this.currentStateKeys.ashvari = this.ashvari.buildStateKey(this.state.ashvari.food, this.state.duskborn.lastAction, this.state.forestStock, this.state.riverStock);
    this.currentStateKeys.duskborn = this.duskborn.buildStateKey(this.state.duskborn.food, this.state.ashvari.lastAction, this.state.forestStock, this.state.riverStock);

    this.pendingActions.ashvari = this.ashvari.chooseAction(this.currentStateKeys.ashvari);
    this.pendingActions.duskborn = this.duskborn.chooseAction(this.currentStateKeys.duskborn);

    this.state.ashvari.currentStateKey = this.currentStateKeys.ashvari;
    this.state.duskborn.currentStateKey = this.currentStateKeys.duskborn;

    this.launchExpedition('ashvari', this.pendingActions.ashvari);
    this.launchExpedition('duskborn', this.pendingActions.duskborn);
    this.phase = 'outbound';
  }

  launchExpedition(tribe, action) {
    const expedition = this.state.expeditions[tribe];
    expedition.action = action;
    expedition.from = { ...(tribe === 'ashvari' ? WORLD_POINTS.ashvariHome : WORLD_POINTS.duskbornHome) };
    expedition.to = { ...getTargetForAction(tribe, action) };
    expedition.travel = 'outbound';
  }

  beginReturn() {
    this.state.expeditions.ashvari.from = { ...this.state.expeditions.ashvari.to };
    this.state.expeditions.duskborn.from = { ...this.state.expeditions.duskborn.to };
    this.state.expeditions.ashvari.to = { ...WORLD_POINTS.ashvariHome };
    this.state.expeditions.duskborn.to = { ...WORLD_POINTS.duskbornHome };
    this.state.expeditions.ashvari.travel = 'returning';
    this.state.expeditions.duskborn.travel = 'returning';
    this.phase = 'returning';
  }

  updateExpeditionPositions() {
    for (const tribe of ['ashvari', 'duskborn']) {
      const expedition = this.state.expeditions[tribe];
      if (expedition.travel === 'outbound') {
        const t = clamp((this.state.minute - SCHEDULE.decide) / (SCHEDULE.resolve - SCHEDULE.decide), 0, 1);
        expedition.position = lerpPoint(expedition.from, expedition.to, t);
      } else if (expedition.travel === 'returning') {
        const t = clamp((this.state.minute - SCHEDULE.returnHome) / (SCHEDULE.finishDay - SCHEDULE.returnHome), 0, 1);
        expedition.position = lerpPoint(expedition.from, expedition.to, t);
      } else {
        expedition.position = { ...expedition.to };
      }
    }
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
    this.phase = 'resolved';
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
    this.state.minute = DAY_START;
    this.state.expeditions.ashvari = this.createExpedition('ashvari', WORLD_POINTS.ashvariHome);
    this.state.expeditions.duskborn = this.createExpedition('duskborn', WORLD_POINTS.duskbornHome);
    this.state.ashvari.brain = this.ashvari.snapshot();
    this.state.duskborn.brain = this.duskborn.snapshot();
    this.phase = 'dawn';
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

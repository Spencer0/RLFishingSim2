import { renderQTablePanel } from './qTablePanel.js';
import { renderMathPanel } from './mathPanel.js';
import { renderPolicyGradientCarMathPanel } from './policyGradientCarMathPanel.js';
import { renderPOMDPQTablePanel } from './pomdpQTablePanel.js';
import { renderPOMDPMathPanel } from './pomdpMathPanel.js';
import { dominantBelief } from './pomdpBrain.js';
import { computeBeliefAccuracy } from './pomdpSimulation.js';
import { renderTribalPayoffPanel } from './tribalPayoffPanel.js';
import { renderTribalQTablePanel } from './tribalQTablePanel.js';
import { renderTribalRelationsPanel } from './tribalRelationsPanel.js';
import { renderTribalStrategyPanel } from './tribalStrategyPanel.js';
import { renderTribalMathPanel } from './tribalMathPanel.js';
import { renderPolicyVisualizationPanel, drawPolicyVisualization } from './policyGradientCarVisualization.js';

const MODE_STATUS_META = {
  simple: { inventoryEmoji: '🐟', inventoryLabel: 'Catch' },
  advanced: { inventoryEmoji: '🐟', inventoryLabel: 'Catch' },
  pomdp: { inventoryEmoji: '💊', inventoryLabel: 'Cures' },
  tribal: { inventoryEmoji: '🍖', inventoryLabel: 'Food' },
  'policy-gradient-car': { inventoryEmoji: '🏁', inventoryLabel: 'Runs' }
};

export function formatStatusReadout(state) {
  if (state.mode === 'tribal') {
    const hour = Math.floor(state.minute / 60) % 24;
    const minute = Math.floor(state.minute % 60);
    return `Day ${state.day} · ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} · 🍖 Ashvari ${state.ashvari.food} · 🍖 Duskborn ${state.duskborn.food}`;
  }
  const meta = MODE_STATUS_META[state.mode] ?? MODE_STATUS_META.simple;
  return `Day ${state.day} · ${meta.inventoryEmoji} ${state.fishInventory} ${meta.inventoryLabel} · Coins ${state.coins}`;
}

export class SimulationPanelController {
  constructor({ statsElement, paneElements, tabButtons }) {
    this.statsElement = statsElement;
    this.paneElements = paneElements;
    this.tabButtons = tabButtons;
    this.tabsConfig = [];
    this.qTableScrollTop = 0;
    this.qTableMarkupKey = '';
  }

  setTabsConfig(tabsConfig) {
    this.tabsConfig = tabsConfig;
  }

  bindTabs() {
    this.tabButtons.forEach((button) => {
      button.addEventListener('click', () => this.activateTab(button.dataset.tab));
    });
  }

  activateTab(tabId) {
    for (const button of this.tabButtons) {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }

    for (const pane of document.querySelectorAll('.details-pane')) {
      pane.classList.toggle('active', pane.id === tabId);
    }
  }

  refresh(state) {
    this.statsElement.textContent = formatStatusReadout(state);

    this.tabsConfig.forEach((tab) => {
      const pane = this.paneElements[tab.id];
      if (!pane) return;
      pane.innerHTML = this.renderPanelForTab(tab.id, state);

      if (tab.id === 'qTablePane') {
        const previousScrollContainer = pane.querySelector('.qtable-wrap');
        if (previousScrollContainer) {
          previousScrollContainer.scrollTop = this.qTableScrollTop;
          previousScrollContainer.onscroll = () => {
            this.qTableScrollTop = previousScrollContainer.scrollTop;
          };
        }
      }
    });
  }

  renderPanelForTab(tabId, state) {
    if (tabId === 'journalPane') {
      return `<ul id="journal">${state.log.slice(0, 10).map((item) => `<li>${item}</li>`).join('')}</ul>`;
    }
    if (tabId === 'brainPane') return `<div id="brain">${renderBrainPanel(state)}</div>`;
    if (tabId === 'stockPane') return `<div id="stockPanel">${renderStockPanel(state)}</div>`;
    if (tabId === 'mathPane') {
      const math = state.mode === 'policy-gradient-car'
        ? renderPolicyGradientCarMathPanel()
        : (state.mode === 'pomdp'
          ? renderPOMDPMathPanel()
          : (state.mode === 'tribal' ? renderTribalMathPanel() : renderMathPanel()));
      return `<div id="mathPanel">${math}</div>`;
    }
    if (tabId === 'qTablePane') {
      if (state.mode === 'policy-gradient-car') {
        const panel = renderPolicyVisualizationPanel(state);
        queueMicrotask(() => drawPolicyVisualization(state));
        return `<div id="qtable">${panel}</div>`;
      }
      const table = state.mode === 'pomdp' ? renderPOMDPQTablePanel(state) : (state.mode === 'tribal' ? renderTribalQTablePanel(state) : renderQTablePanel(state));
      return `<div id="qtable">${table}</div>`;
    }
    if (tabId === 'payoffPane') return renderTribalPayoffPanel(state);
    if (tabId === 'relationsPane') return renderTribalRelationsPanel(state);
    if (tabId === 'strategyPane') return renderTribalStrategyPanel(state);
    return '';
  }
}

function renderBrainPanel(state) {
  if (state.mode === 'tribal') {
    const rowA = state.ashvari.brain.qTable?.[state.ashvari.currentStateKey] ?? { hunt: 0, fish: 0, trade: 0, raid: 0 };
    const rowB = state.duskborn.brain.qTable?.[state.duskborn.currentStateKey] ?? { hunt: 0, fish: 0, trade: 0, raid: 0 };
    const prefA = Object.keys(rowA).reduce((best, a) => rowA[a] > rowA[best] ? a : best, 'hunt');
    const prefB = Object.keys(rowB).reduce((best, a) => rowB[a] > rowB[best] ? a : best, 'hunt');
    return `<div class="tribal-grid-2">
      <div><h4>ASHVARI</h4><p><b>Epsilon:</b> ${state.ashvari.brain.epsilon.toFixed(2)}</p><p><b>Current State:</b> ${state.ashvari.currentStateKey}</p><p><b>Preferred Action:</b> ${prefA}</p><p><b>Q(Hunt):</b> ${rowA.hunt.toFixed(2)}</p><p><b>Q(Fish):</b> ${rowA.fish.toFixed(2)}</p><p><b>Q(Trade):</b> ${rowA.trade.toFixed(2)}</p><p><b>Q(Raid):</b> ${rowA.raid.toFixed(2)}</p><p><b>Food:</b> ${state.ashvari.food}</p><p><b>Reputation:</b> ${state.ashvari.reputation}</p></div>
      <div><h4>DUSKBORN</h4><p><b>Epsilon:</b> ${state.duskborn.brain.epsilon.toFixed(2)}</p><p><b>Current State:</b> ${state.duskborn.currentStateKey}</p><p><b>Preferred Action:</b> ${prefB}</p><p><b>Q(Hunt):</b> ${rowB.hunt.toFixed(2)}</p><p><b>Q(Fish):</b> ${rowB.fish.toFixed(2)}</p><p><b>Q(Trade):</b> ${rowB.trade.toFixed(2)}</p><p><b>Q(Raid):</b> ${rowB.raid.toFixed(2)}</p><p><b>Food:</b> ${state.duskborn.food}</p><p><b>Reputation:</b> ${state.duskborn.reputation}</p></div>
    </div>`;
  }

  if (state.mode === 'advanced') {
    const stateKey = describeAdvancedState(state.stockLevels);
    const qValuesForState = state.brain.qTable?.[state.stockLevels.lake[0] + state.stockLevels.river[0] + state.stockLevels.ocean[0]]
      ?? { lake: 0, river: 0, ocean: 0 };
    return `<p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)} | <b>Alpha</b>: ${state.brain.alpha.toFixed(2)} | <b>Gamma</b>: ${state.brain.gamma.toFixed(2)}</p>
      <p><b>Visited States</b>: ${state.brain.visitedStates} / 27</p>
      <p><b>Current State</b>: ${stateKey}</p>
      <p><b>Q(Lake)</b>: ${qValuesForState.lake.toFixed(2)}</p>
      <p><b>Q(River)</b>: ${qValuesForState.river.toFixed(2)}</p>
      <p><b>Q(Ocean)</b>: ${qValuesForState.ocean.toFixed(2)}</p>
      <p><b>Total Reward</b>: ${state.brain.totalReward.toFixed(1)} coins</p>`;
  }

  if (state.mode === 'policy-gradient-car') {
    return `<p><b>Episodes</b>: ${state.policy.episode}</p>
      <p><b>Consecutive completions</b>: ${state.policy.consecutiveCompletions} / 3</p>
      <p><b>Current μ</b>: ${state.policy.lastMu.toFixed(3)}</p>
      <p><b>Current σ</b>: ${state.policy.lastSigma.toFixed(3)}</p>
      <p><b>Last Action</b>: ${state.policy.lastAction.toFixed(3)}°</p>
      <p><b>Last Return</b>: ${state.policy.lastReturn.toFixed(3)}</p>
      <p><b>Last Loss</b>: ${state.policy.lastLoss.toFixed(4)}</p>
      <p><b>Training</b>: ${state.trainingComplete ? 'Complete (frozen policy)' : 'In progress'}</p>`;
  }


  if (state.mode === 'pomdp') {
    const habitats = ['wetland', 'forest', 'savanna'];
    const dominantSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${formatPrevalence(dominantBelief(state.belief[habitat]))}`).join(' · ');
    const observationSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${state.lastObservations[habitat] ?? '?'}`).join(' · ');
    const truthSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${formatPrevalence(state.truePrevalence[habitat])}`).join(' · ');
    const qValues = state.brain.qTable?.[state.beliefKey] ?? { wetland: 0, forest: 0, savanna: 0 };
    const accuracy = computeBeliefAccuracy(state);
    return `<p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)} | <b>Alpha</b>: ${state.brain.alpha.toFixed(2)} | <b>Gamma</b>: ${state.brain.gamma.toFixed(2)}</p>
      <p><b>Belief Key</b>: ${state.beliefKey.toUpperCase()} (current discretized belief state)</p>
      <p><b>Dominant Belief</b>: ${dominantSummary}</p>
      <p><b>Last Observations</b>: ${observationSummary}</p>
      <p><b>True Prevalence</b>: ${truthSummary}</p>
      <p><b>Belief Accuracy</b>: ${accuracy}/3 habitats correctly estimated</p>
      <p><b>Q(Wetland)</b>: ${qValues.wetland.toFixed(2)}</p>
      <p><b>Q(Forest)</b>: ${qValues.forest.toFixed(2)}</p>
      <p><b>Q(Savanna)</b>: ${qValues.savanna.toFixed(2)}</p>
      <p><b>Total Reward</b>: ${state.brain.totalReward.toFixed(0)} points</p>`;
  }

  return `<p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)}</p>
    <p><b>Q(Lake)</b>: ${state.brain.qValues.lake.toFixed(2)} (${state.brain.visits.lake} visits)</p>
    <p><b>Q(River)</b>: ${state.brain.qValues.river.toFixed(2)} (${state.brain.visits.river} visits)</p>
    <p><b>Q(Ocean)</b>: ${state.brain.qValues.ocean.toFixed(2)} (${state.brain.visits.ocean} visits)</p>
    <p><b>Boat</b>: ${state.hasBoat ? 'Rented (ocean enabled)' : 'Not rented yet'}</p>
    <p><b>Total Reward</b>: ${state.brain.totalReward} coins</p>`;
}

function formatPrevalence(value) {
  return `${value[0].toUpperCase()}${value.slice(1)}`;
}

function renderPOMDPStockPanel(state) {
  const habitats = ['wetland', 'forest', 'savanna'];
  const rows = habitats.map((habitat) => {
    const dominant = dominantBelief(state.belief[habitat]);
    const match = dominant === state.truePrevalence[habitat] ? '✓' : '✗';
    const transition = state.transitionTimers[habitat]?.daysUntilTransition ?? 0;
    const belief = state.belief[habitat];
    return `<p><b>${formatPrevalence(habitat)}</b>: true ${formatPrevalence(state.truePrevalence[habitat])} · belief L=${belief.low.toFixed(2)} M=${belief.medium.toFixed(2)} H=${belief.high.toFixed(2)} · match ${match} · days since visit ${state.daysSinceLastVisit[habitat]} · transition in ${transition} day(s)</p>`;
  }).join('');

  return `<p>Dual-layer monitor: hidden truth vs inferred belief.</p>${rows}`;
}

function renderStockPanel(state) {
  if (state.mode === 'pomdp') return renderPOMDPStockPanel(state);
  const row = (spot) => {
    const timer = state.replenishTimers[spot];
    return `<p><b>${spot}</b>: ${state.stockLevels[spot].toUpperCase()} · regrowth queue ${timer.pendingLevels} · next bloom in ${timer.actionsUntilReplenish} action(s)</p>`;
  };

  return `<p>These waters breathe: each trip pressures local fish populations, and recovery rolls forward over time.</p>
    <p>Use this panel to track each habitat's health and upcoming regrowth cycles.</p>
    ${row('lake')}${row('river')}${row('ocean')}`;
}

function describeAdvancedState(stockLevels) {
  const normalize = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;
  return `Lake ${normalize(stockLevels.lake)} · River ${normalize(stockLevels.river)} · Ocean ${normalize(stockLevels.ocean)}`;
}

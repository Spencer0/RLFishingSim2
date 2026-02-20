import { renderQTablePanel } from './qTablePanel.js';
import { renderMathPanel } from './mathPanel.js';
import { renderPOMDPQTablePanel } from './pomdpQTablePanel.js';
import { renderPOMDPMathPanel } from './pomdpMathPanel.js';
import { dominantBelief } from './pomdpBrain.js';
import { computeBeliefAccuracy } from './pomdpSimulation.js';

const MODE_STATUS_META = {
  simple: { inventoryEmoji: '🐟', inventoryLabel: 'Catch' },
  advanced: { inventoryEmoji: '🐟', inventoryLabel: 'Catch' },
  pomdp: { inventoryEmoji: '💊', inventoryLabel: 'Cures' }
};

export function formatStatusReadout(state) {
  const meta = MODE_STATUS_META[state.mode] ?? MODE_STATUS_META.simple;
  return `Day ${state.day} · ${meta.inventoryEmoji} ${state.fishInventory} ${meta.inventoryLabel} · Coins ${state.coins}`;
}

export class SimulationPanelController {
  constructor({ statsElement, brainElement, journalElement, qTableElement, stockPanelElement, mathElement, tabButtons }) {
    this.statsElement = statsElement;
    this.brainElement = brainElement;
    this.journalElement = journalElement;
    this.qTableElement = qTableElement;
    this.stockPanelElement = stockPanelElement;
    this.mathElement = mathElement;
    this.tabButtons = tabButtons;
    this.qTableScrollTop = 0;
    this.qTableMarkupKey = '';
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

    this.brainElement.innerHTML = renderBrainPanel(state);
    if (this.stockPanelElement) this.stockPanelElement.innerHTML = renderStockPanel(state);
    if (this.mathElement) this.mathElement.innerHTML = state.mode === 'pomdp' ? renderPOMDPMathPanel() : renderMathPanel();
    if (this.qTableElement) {
      const previousScrollContainer = this.qTableElement.querySelector('.qtable-wrap');
      if (previousScrollContainer) {
        this.qTableScrollTop = previousScrollContainer.scrollTop;
      }

      const qTableMarkup = state.mode === 'pomdp' ? renderPOMDPQTablePanel(state) : renderQTablePanel(state);
      if (qTableMarkup !== this.qTableMarkupKey) {
        this.qTableElement.innerHTML = qTableMarkup;
        this.qTableMarkupKey = qTableMarkup;
      }

      const scrollContainer = this.qTableElement.querySelector('.qtable-wrap');
      if (scrollContainer) {
        const restoredScrollTop = this.qTableScrollTop;
        scrollContainer.scrollTop = restoredScrollTop;
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = restoredScrollTop;
        });
        scrollContainer.onscroll = () => {
          this.qTableScrollTop = scrollContainer.scrollTop;
        };
      }
    }
    this.journalElement.innerHTML = state.log.slice(0, 10).map((item) => `<li>${item}</li>`).join('');
  }
}

function renderBrainPanel(state) {
  if (state.mode === 'advanced') {
    const stateKey = describeAdvancedState(state.stockLevels);
    const qValuesForState = state.brain.qTable?.[state.stockLevels.lake[0] + state.stockLevels.river[0] + state.stockLevels.ocean[0]]
      ?? { lake: 0, river: 0, ocean: 0 };
    return `
      <p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)} | <b>Alpha</b>: ${state.brain.alpha.toFixed(2)} | <b>Gamma</b>: ${state.brain.gamma.toFixed(2)}</p>
      <p><b>Visited States</b>: ${state.brain.visitedStates} / 27</p>
      <p><b>Current State</b>: ${stateKey}</p>
      <p><b>Q(Lake)</b>: ${qValuesForState.lake.toFixed(2)}</p>
      <p><b>Q(River)</b>: ${qValuesForState.river.toFixed(2)}</p>
      <p><b>Q(Ocean)</b>: ${qValuesForState.ocean.toFixed(2)}</p>
      <p><b>Total Reward</b>: ${state.brain.totalReward.toFixed(1)} coins</p>`;
  }

  if (state.mode === 'pomdp') {
    const habitats = ['wetland', 'forest', 'savanna'];
    const dominantSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${formatPrevalence(dominantBelief(state.belief[habitat]))}`).join(' · ');
    const observationSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${state.lastObservations[habitat] ?? '?'}`).join(' · ');
    const truthSummary = habitats.map((habitat) => `${formatPrevalence(habitat)}=${formatPrevalence(state.truePrevalence[habitat])}`).join(' · ');
    const qValues = state.brain.qTable?.[state.beliefKey] ?? { wetland: 0, forest: 0, savanna: 0 };
    const accuracy = computeBeliefAccuracy(state);
    return `
      <p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)} | <b>Alpha</b>: ${state.brain.alpha.toFixed(2)} | <b>Gamma</b>: ${state.brain.gamma.toFixed(2)}</p>
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

  return `
    <p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)}</p>
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

  return `
    <p>Dual-layer monitor: hidden truth vs inferred belief.</p>
    ${rows}`;
}

function renderStockPanel(state) {
  if (state.mode === 'pomdp') {
    return renderPOMDPStockPanel(state);
  }

  const row = (spot) => {
    const timer = state.replenishTimers[spot];
    return `<p><b>${spot}</b>: ${state.stockLevels[spot].toUpperCase()} · regrowth queue ${timer.pendingLevels} · next bloom in ${timer.actionsUntilReplenish} action(s)</p>`;
  };

  return `
    <p>These waters breathe: each trip pressures local fish populations, and recovery rolls forward over time.</p>
    <p>Use this panel to track each habitat's health and upcoming regrowth cycles.</p>
    ${row('lake')}
    ${row('river')}
    ${row('ocean')}`;
}

function describeAdvancedState(stockLevels) {
  const normalize = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;
  return `Lake ${normalize(stockLevels.lake)} · River ${normalize(stockLevels.river)} · Ocean ${normalize(stockLevels.ocean)}`;
}

import { renderQTablePanel } from './qTablePanel.js';

function describeAdvancedState(stockLevels) {
  const normalize = (value) => `${value[0].toUpperCase()}${value.slice(1)}`;
  return `Lake ${normalize(stockLevels.lake)} · River ${normalize(stockLevels.river)} · Ocean ${normalize(stockLevels.ocean)}`;
}

export class SimulationPanelController {
  constructor({ statsElement, brainElement, journalElement, qTableElement, stockPanelElement, tabButtons }) {
    this.statsElement = statsElement;
    this.brainElement = brainElement;
    this.journalElement = journalElement;
    this.qTableElement = qTableElement;
    this.stockPanelElement = stockPanelElement;
    this.tabButtons = tabButtons;
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
    const hour = String(Math.floor(state.minute / 60) % 24).padStart(2, '0');
    const minute = String(state.minute % 60).padStart(2, '0');
    const extraStatus = state.mode === 'advanced'
      ? `State ${describeAdvancedState(state.stockLevels)}`
      : (state.hasBoat ? '⛵ Boat ready' : '🧾 Need 100 coins for boat');
    this.statsElement.textContent = `Day ${state.day} · Time ${hour}:${minute} · 🐟 ${state.fishInventory} · Coins ${state.coins} · ${extraStatus}`;

    this.brainElement.innerHTML = renderBrainPanel(state);
    if (this.stockPanelElement) this.stockPanelElement.innerHTML = renderStockPanel(state);
    if (this.qTableElement) {
      const previousScrollContainer = this.qTableElement.querySelector('.qtable-wrap');
      const previousScrollTop = previousScrollContainer?.scrollTop ?? 0;
      this.qTableElement.innerHTML = renderQTablePanel(state);
      const nextScrollContainer = this.qTableElement.querySelector('.qtable-wrap');
      if (nextScrollContainer) nextScrollContainer.scrollTop = previousScrollTop;
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

  return `
    <p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)}</p>
    <p><b>Q(Lake)</b>: ${state.brain.qValues.lake.toFixed(2)} (${state.brain.visits.lake} visits)</p>
    <p><b>Q(River)</b>: ${state.brain.qValues.river.toFixed(2)} (${state.brain.visits.river} visits)</p>
    <p><b>Q(Ocean)</b>: ${state.brain.qValues.ocean.toFixed(2)} (${state.brain.visits.ocean} visits)</p>
    <p><b>Boat</b>: ${state.hasBoat ? 'Rented (ocean enabled)' : 'Not rented yet'}</p>
    <p><b>Total Reward</b>: ${state.brain.totalReward} coins</p>`;
}

function renderStockPanel(state) {
  const row = (spot) => {
    const timer = state.replenishTimers[spot];
    return `<p><b>${spot}</b>: ${state.stockLevels[spot].toUpperCase()} · regrowth queue ${timer.pendingLevels} · next bloom in ${timer.daysUntilReplenish} day(s)</p>`;
  };

  return `
    <p>These waters breathe: each trip pressures local fish populations, and recovery rolls forward over time.</p>
    <p>Use this panel to track each habitat's health and upcoming regrowth cycles.</p>
    ${row('lake')}
    ${row('river')}
    ${row('ocean')}`;
}

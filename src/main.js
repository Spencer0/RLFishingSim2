import { FishingSimulation as SimpleFishingSimulation } from './simulation.js';
import { AdvancedFishingSimulation } from './advancedSimulation.js';
import { renderSimpleSimulationScene } from './simpleRenderer.js';
import { renderAdvancedSimulationScene } from './advancedRenderer.js';
import { renderQTablePanel } from './qTablePanel.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing app');

let activeSimulation = null;
let drawIntervalId = null;
let tickIntervalId = null;

renderHomeScreen();

function renderHomeScreen() {
  clearSimulationIntervals();
  app.innerHTML = `
  <div class="home-layout">
    <section class="home-card glass">
      <h1>🎣 RL Fishing Lab</h1>
      <p class="subtitle">Choose a simulation to explore reinforcement learning behavior.</p>
      <div class="menu-grid">
        <button id="startSimple" class="menu-button">Simple Markov Simulation</button>
        <button id="startAdvanced" class="menu-button">Advanced Markov Simulation</button>
      </div>
    </section>
  </div>`;

  document.querySelector('#startSimple')?.addEventListener('click', () => startSimulation('simple'));
  document.querySelector('#startAdvanced')?.addEventListener('click', () => startSimulation('advanced'));
}

function startSimulation(mode) {
  clearSimulationIntervals();
  activeSimulation = mode === 'advanced' ? new AdvancedFishingSimulation() : new SimpleFishingSimulation();

  app.innerHTML = `
  <div class="layout">
    <header class="topbar glass">
      <div>
        <h1>🎣 RL Fishing Simulator (${mode === 'advanced' ? 'Advanced' : 'Simple'})</h1>
        <p class="subtitle">${mode === 'advanced'
          ? 'Q-table over stock states (3^3) with replenishment dynamics'
          : 'Epsilon-greedy day planning: lake vs river vs ocean (boat unlock)'}</p>
      </div>
      <button id="goHome" class="btn secondary">Home</button>
      <button id="playPause" class="btn">Pause</button>
      <div id="stats" class="stats-pill"></div>
    </header>
    <main class="content">
      <section class="canvas-wrap glass">
        <canvas id="world" width="800" height="500" aria-label="Fishing world"></canvas>
      </section>
      <section class="simulation-details glass" aria-label="Simulation details">
        <h2>Simulation Details</h2>
        <div class="details-tabs" role="tablist" aria-label="Simulation detail tabs">
          <button class="detail-tab active" role="tab" aria-selected="true" aria-controls="journalPane" data-tab="journalPane">📓 Journal</button>
          <button class="detail-tab" role="tab" aria-selected="false" aria-controls="brainPane" data-tab="brainPane">🧠 Brain</button>
          <button class="detail-tab" role="tab" aria-selected="false" aria-controls="qTablePane" data-tab="qTablePane">🗂️ Q Table</button>
          ${mode === 'advanced' ? '<button class="detail-tab" role="tab" aria-selected="false" aria-controls="stockPane" data-tab="stockPane">📦 Stock</button>' : ''}
        </div>
        <div class="details-panes">
          <section id="journalPane" class="details-pane active" role="tabpanel"><ul id="journal"></ul></section>
          <section id="brainPane" class="details-pane" role="tabpanel"><div id="brain"></div></section>
          <section id="qTablePane" class="details-pane" role="tabpanel"><div id="qtable"></div></section>
          ${mode === 'advanced' ? '<section id="stockPane" class="details-pane" role="tabpanel"><div id="stockPanel"></div></section>' : ''}
        </div>
      </section>
    </main>
  </div>`;

  const canvas = document.querySelector('#world');
  const context = canvas.getContext('2d');
  const statsElement = document.querySelector('#stats');
  const brainElement = document.querySelector('#brain');
  const journalElement = document.querySelector('#journal');
  const qTableElement = document.querySelector('#qtable');
  const stockPanelElement = document.querySelector('#stockPanel');
  const playPauseButton = document.querySelector('#playPause');
  const tabButtons = [...document.querySelectorAll('.detail-tab')];

  const activateTab = (tabId) => {
    for (const button of tabButtons) {
      const isActive = button.dataset.tab === tabId;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    }

    for (const pane of document.querySelectorAll('.details-pane')) {
      pane.classList.toggle('active', pane.id === tabId);
    }
  };

  tabButtons.forEach((button) => {
    button.addEventListener('click', () => activateTab(button.dataset.tab));
  });

  document.querySelector('#goHome')?.addEventListener('click', renderHomeScreen);

  playPauseButton?.addEventListener('click', () => {
    activeSimulation.togglePlay();
    playPauseButton.textContent = activeSimulation.getState().isPlaying ? 'Pause' : 'Play';
  });

  const drawFrame = () => {
    const state = activeSimulation.getState();
    drawWorld(context, canvas, state);

    const hour = String(Math.floor(state.minute / 60) % 24).padStart(2, '0');
    const minute = String(state.minute % 60).padStart(2, '0');
    const extraStatus = state.mode === 'advanced'
      ? `State ${state.stockLevels.lake[0].toUpperCase()}${state.stockLevels.river[0].toUpperCase()}${state.stockLevels.ocean[0].toUpperCase()}`
      : (state.hasBoat ? '⛵ Boat ready' : '🧾 Need 100 coins for boat');
    statsElement.textContent = `Day ${state.day} · Time ${hour}:${minute} · 🐟 ${state.fishInventory} · 🪙 ${state.coins} · ${extraStatus}`;

    brainElement.innerHTML = renderBrainPanel(state);
    if (stockPanelElement) stockPanelElement.innerHTML = renderStockPanel(state);
    if (qTableElement) qTableElement.innerHTML = renderQTablePanel(state);
    journalElement.innerHTML = state.log.slice(0, 10).map((item) => `<li>${item}</li>`).join('');
  };

  tickIntervalId = setInterval(() => activeSimulation.tick(10), 220);
  drawIntervalId = setInterval(drawFrame, 120);
}

function renderBrainPanel(state) {
  if (state.mode === 'advanced') {
    const stateKey = `${state.stockLevels.lake[0].toUpperCase()}${state.stockLevels.river[0].toUpperCase()}${state.stockLevels.ocean[0].toUpperCase()}`;
    const qValuesForState = state.brain.qTable?.[state.stockLevels.lake[0] + state.stockLevels.river[0] + state.stockLevels.ocean[0]]
      ?? { lake: 0, river: 0, ocean: 0 };
    return `
      <p><b>Epsilon</b>: ${state.brain.epsilon.toFixed(2)} | <b>Alpha</b>: ${state.brain.alpha.toFixed(2)} | <b>Gamma</b>: ${state.brain.gamma.toFixed(2)}</p>
      <p><b>Visited States</b>: ${state.brain.visitedStates} / 27</p>
      <p><b>Current State</b>: ${stateKey} (Lake/River/Ocean stock)</p>
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

function drawWorld(ctx, canvas, state) {
  if (state.mode === 'advanced') {
    renderAdvancedSimulationScene(ctx, canvas, state);
  } else {
    renderSimpleSimulationScene(ctx, canvas, state);
  }
}

function clearSimulationIntervals() {
  if (drawIntervalId) clearInterval(drawIntervalId);
  if (tickIntervalId) clearInterval(tickIntervalId);
  drawIntervalId = null;
  tickIntervalId = null;
  activeSimulation = null;
}

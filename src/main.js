import { renderSimpleSimulationScene } from './simpleRenderer.js';
import { renderAdvancedSimulationScene } from './advancedRenderer.js';
import { createDefaultSimulationCatalog } from './simulationCatalog.js';
import { buildPanelRenderKey } from './panelState.js';
import { SimulationLoop } from './simulationLoop.js';
import { SimulationPanelController } from './simulationPanelController.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing app');

const simulationCatalog = createDefaultSimulationCatalog();
const simulationLoop = new SimulationLoop();

let activeSimulation = null;

renderHomeScreen();

function renderHomeScreen() {
  stopSimulation();
  const modeButtons = simulationCatalog.listModes()
    .map((mode) => `<button data-mode="${mode}" class="menu-button">${simulationCatalog.get(mode).label} Markov Simulation</button>`)
    .join('');

  app.innerHTML = `
  <div class="home-layout">
    <section class="home-card glass">
      <h1>🎣 RL Fishing Lab</h1>
      <p class="subtitle">Choose a simulation to explore reinforcement learning behavior.</p>
      <div class="menu-grid">${modeButtons}</div>
    </section>
  </div>`;

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => startSimulation(button.dataset.mode));
  });
}

function startSimulation(mode) {
  stopSimulation();
  const config = simulationCatalog.get(mode);
  if (!config) throw new Error(`Unknown simulation mode: ${mode}`);

  activeSimulation = config.createSimulation();

  app.innerHTML = `
  <div class="layout">
    <header class="topbar glass">
      <div>
        <h1>🎣 RL Fishing Simulator (${config.label})</h1>
        <p class="subtitle">${config.subtitle}</p>
      </div>
      <button id="goHome" class="btn secondary">Home</button>
      <button id="playPause" class="btn">Pause</button>
      <div class="sim-speed-wrap" aria-label="Simulation speed controls">
        <label for="simSpeed" class="sim-speed-label">Speed <span id="simSpeedValue">10x</span></label>
        <input id="simSpeed" class="sim-speed-slider" type="range" min="1" max="100" step="1" value="10" aria-label="Simulation speed from one to one hundred times" />
      </div>
      <div id="stats" class="stats-pill"></div>
    </header>
    <main class="content">
      <section class="canvas-wrap glass">
        <div class="canvas-shell" id="canvasShell">
          <canvas id="world" width="800" height="500" aria-label="Fishing world"></canvas>
          <div id="fastForwardBadge" class="fast-forward-badge" aria-hidden="true">⏩ Fast forward</div>
        </div>
      </section>
      <section class="simulation-details glass" aria-label="Simulation details">
        <h2>Simulation Details</h2>
        <div class="details-tabs" role="tablist" aria-label="Simulation detail tabs">
          <button class="detail-tab active" role="tab" aria-selected="true" aria-controls="journalPane" data-tab="journalPane">📓 Journal</button>
          <button class="detail-tab" role="tab" aria-selected="false" aria-controls="brainPane" data-tab="brainPane">🧠 Brain</button>
          <button class="detail-tab" role="tab" aria-selected="false" aria-controls="qTablePane" data-tab="qTablePane">🗂️ Q Table</button>
          ${config.hasStockPanel ? '<button class="detail-tab" role="tab" aria-selected="false" aria-controls="stockPane" data-tab="stockPane">📦 Stock</button>' : ''}
        </div>
        <div class="details-panes">
          <section id="journalPane" class="details-pane active" role="tabpanel"><ul id="journal"></ul></section>
          <section id="brainPane" class="details-pane" role="tabpanel"><div id="brain"></div></section>
          <section id="qTablePane" class="details-pane" role="tabpanel"><div id="qtable"></div></section>
          ${config.hasStockPanel ? '<section id="stockPane" class="details-pane" role="tabpanel"><div id="stockPanel"></div></section>' : ''}
        </div>
      </section>
    </main>
  </div>`;

  const canvas = document.querySelector('#world');
  const context = canvas.getContext('2d');
  const playPauseButton = document.querySelector('#playPause');
  const speedSlider = document.querySelector('#simSpeed');
  const speedValue = document.querySelector('#simSpeedValue');
  const canvasShell = document.querySelector('#canvasShell');
  const fastForwardBadge = document.querySelector('#fastForwardBadge');

  const setSpeedUiState = (speed) => {
    if (speedValue) speedValue.textContent = `${speed}x`;
    const isFastForwarding = speed > 20;
    canvasShell?.classList.toggle('fast-forward-active', isFastForwarding);
    fastForwardBadge?.classList.toggle('visible', isFastForwarding);
  };

  const panelController = new SimulationPanelController({
    statsElement: document.querySelector('#stats'),
    brainElement: document.querySelector('#brain'),
    journalElement: document.querySelector('#journal'),
    qTableElement: document.querySelector('#qtable'),
    stockPanelElement: document.querySelector('#stockPanel'),
    tabButtons: [...document.querySelectorAll('.detail-tab')]
  });
  panelController.bindTabs();

  speedSlider?.addEventListener('input', (event) => {
    const speed = Number(event.target.value);
    simulationLoop.setSimulationSpeed(speed);
    setSpeedUiState(speed);
    panelController.refresh(activeSimulation.getState());
  });

  let lastPanelRenderKey = '';
  const refreshPanels = () => {
    const state = activeSimulation.getState();
    panelController.refresh(state);
    lastPanelRenderKey = buildPanelRenderKey(state);
  };

  document.querySelector('#goHome')?.addEventListener('click', renderHomeScreen);
  playPauseButton?.addEventListener('click', () => {
    activeSimulation.togglePlay();
    playPauseButton.textContent = activeSimulation.getState().isPlaying ? 'Pause' : 'Play';
    refreshPanels();
  });

  simulationLoop.setSimulationSpeed(10);
  if (speedSlider) speedSlider.value = String(simulationLoop.getSimulationSpeed());
  setSpeedUiState(simulationLoop.getSimulationSpeed());

  refreshPanels();
  simulationLoop.start({
    getSimulation: () => activeSimulation,
    onDraw: (state) => drawWorld(context, canvas, state),
    onSimulationAdvanced: (state) => {
      const nextPanelRenderKey = buildPanelRenderKey(state);
      if (nextPanelRenderKey !== lastPanelRenderKey) {
        panelController.refresh(state);
        lastPanelRenderKey = nextPanelRenderKey;
      }
    }
  });
}

function drawWorld(ctx, canvas, state) {
  if (state.mode === 'advanced') {
    renderAdvancedSimulationScene(ctx, canvas, state);
  } else {
    renderSimpleSimulationScene(ctx, canvas, state);
  }
}

function stopSimulation() {
  simulationLoop.stop();
  activeSimulation = null;
}

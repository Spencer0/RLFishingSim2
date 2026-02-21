import { renderSimpleSimulationScene } from './simpleRenderer.js';
import { renderAdvancedSimulationScene } from './advancedRenderer.js';
import { createDefaultSimulationCatalog } from './simulationCatalog.js';
import { renderPOMDPScene } from './pomdpRenderer.js';
import { buildPanelRenderKey } from './panelState.js';
import { SimulationLoop } from './simulationLoop.js';
import { SimulationPanelController } from './simulationPanelController.js';
import { renderTribalScene } from './tribalRenderer.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing app');

const simulationCatalog = createDefaultSimulationCatalog();
const simulationLoop = new SimulationLoop();

let activeSimulation = null;

renderHomeScreen();

function renderHomeScreen() {
  stopSimulation();
  const modeButtons = simulationCatalog.listModes()
    .map((mode) => {
      const config = simulationCatalog.get(mode);
      return `<button data-mode="${mode}" class="menu-button"><span aria-hidden="true">${config.homeEmoji}</span> ${config.homeButtonLabel}</button>`;
    })
    .join('');

  app.innerHTML = `
  <div class="home-layout">
    <section class="home-card glass">
      <h1>🧪 RL Simulation Lab</h1>
      <p class="subtitle">Choose a simulation to explore reinforcement learning behavior.</p>
      <div class="menu-grid">${modeButtons}</div>
    </section>
  </div>`;

  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.addEventListener('click', () => startSimulation(button.dataset.mode));
  });
}


function getTabsForConfig(config) {
  if (config.tabs?.length) return config.tabs;
  const tabs = [
    { id: 'journalPane', label: '📓 Journal' },
    { id: 'brainPane', label: '🧠 Brain' },
    { id: 'qTablePane', label: '🗂️ Q Table' },
    { id: 'mathPane', label: '∑ Math' }
  ];
  if (config.hasStockPanel) tabs.push({ id: 'stockPane', label: '📦 Stock' });
  return tabs;
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
        <h1><span aria-hidden="true">${config.titleEmoji}</span> ${(config.titleText ?? 'RL Simulator')} (${config.label})</h1>
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
          <canvas id="world" width="800" height="500" aria-label="Simulation world"></canvas>
          <div id="fastForwardBadge" class="fast-forward-badge" aria-hidden="true">⏩ Fast forward</div>
        </div>
      </section>
      <section class="simulation-details glass" aria-label="Simulation details">
        <h2>Simulation Details</h2>
        <div class="details-tabs" role="tablist" aria-label="Simulation detail tabs">
          ${getTabsForConfig(config).map((tab, index) => `<button class="detail-tab ${index === 0 ? 'active' : ''}" role="tab" aria-selected="${index === 0}" aria-controls="${tab.id}" data-tab="${tab.id}">${tab.label}</button>`).join('')}
        </div>
        <div class="details-panes">
          ${getTabsForConfig(config).map((tab, index) => `<section id="${tab.id}" class="details-pane ${index === 0 ? 'active' : ''}" role="tabpanel"></section>`).join('')}
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
    paneElements: [...document.querySelectorAll('.details-pane')].reduce((acc, pane) => ({ ...acc, [pane.id]: pane }), {}),
    tabButtons: [...document.querySelectorAll('.detail-tab')]
  });
  panelController.bindTabs();
  panelController.setTabsConfig(getTabsForConfig(config));

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
  } else if (state.mode === 'pomdp') {
    renderPOMDPScene(ctx, canvas, state);
  } else if (state.mode === 'tribal') {
    renderTribalScene(ctx, canvas, state);
  } else {
    renderSimpleSimulationScene(ctx, canvas, state);
  }
}

function stopSimulation() {
  simulationLoop.stop();
  activeSimulation = null;
}

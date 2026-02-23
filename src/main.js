import { renderSimpleSimulationScene } from './domains/simple/simpleRenderer.js';
import { renderAdvancedSimulationScene } from './domains/advanced/advancedRenderer.js';
import { createDefaultSimulationCatalog } from './simulationCatalog.js';
import { renderPOMDPScene } from './domains/pomdp/pomdpRenderer.js';
import { buildPanelRenderKey } from './panelState.js';
import { SimulationLoop } from './simulationLoop.js';
import { SimulationPanelController } from './simulationPanelController.js';
import { renderTribalScene } from './domains/tribal/tribalRenderer.js';
import { renderPolicyGradientCarScene } from './domains/policyGradientCar/policyGradientCarRenderer.js';
import { renderPPOFigure8Scene } from './domains/ppoFigure8/ppoFigure8Visualization.js';
import {
  DEPLOYMENT_EPISODES_PER_LANE,
  DEPLOYMENT_LANES,
  DEPLOYMENT_SIMULATION_SPEED,
  DeploymentLaneRunner,
  createDeploymentScore
} from './domains/policyGradientCar/policyDeployment.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing app');

const simulationCatalog = createDefaultSimulationCatalog();
const simulationLoop = new SimulationLoop();

let activeSimulation = null;
let deploymentLoopHandle = null;

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

  const deployButtonMarkup = config.supportsDeployment
    ? '<button id="deployModel" class="btn deploy" aria-label="Deploy trained model">🚀 Deploy the model!</button>'
    : '';
  const deployFooterMarkup = deployButtonMarkup
    ? `<footer class="simulation-footer">${deployButtonMarkup}</footer>`
    : '';

  app.innerHTML = `
  <div class="layout simulation-layout">
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
    ${deployFooterMarkup}
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

  document.querySelector('#deployModel')?.addEventListener('click', () => {
    if (!activeSimulation || typeof activeSimulation.getDeploymentSnapshot !== 'function') return;
    const snapshot = activeSimulation.getDeploymentSnapshot();
    if (!snapshot) return;
    startDeploymentView({
      mode,
      config,
      snapshot
    });
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

function startDeploymentView({ mode, config, snapshot }) {
  stopSimulation();

  const params = new URLSearchParams(window.location.search);
  const deploymentLanes = Number(params.get('deployLanes')) || DEPLOYMENT_LANES;
  const deploymentEpisodes = Number(params.get('deployEpisodes')) || DEPLOYMENT_EPISODES_PER_LANE;
  const deploymentSpeed = Number(params.get('deploySpeed')) || DEPLOYMENT_SIMULATION_SPEED;

  const lanes = Array.from({ length: deploymentLanes }, (_, index) => new DeploymentLaneRunner({
    id: index + 1,
    episodesTarget: deploymentEpisodes,
    networkSnapshot: snapshot.network
  }));

  app.innerHTML = `
  <div class="layout deployment-layout">
    <header class="topbar glass deployment-header">
      <div>
        <h1>🚀 Deploy the model! (${config.label})</h1>
        <p class="subtitle">Running ${deploymentLanes} parallel simulations at ${deploymentSpeed}x speed for ${deploymentEpisodes} attempts each.</p>
      </div>
      <button id="goHome" class="btn secondary">Home</button>
      <div id="deploymentStats" class="stats-pill">Initializing deployment…</div>
    </header>
    <main class="deployment-content">
      <section id="deploymentGrid" class="deployment-grid" aria-label="Parallel deployment simulations"></section>
    </main>
    <div id="deploymentResultModal" class="deploy-modal hidden" role="dialog" aria-modal="true" aria-label="Deployment score modal">
      <div class="deploy-modal-card glass">
        <h2 id="deploymentScore">You scored 0 / 0!</h2>
        <p>Model deployment finished across all simulation lanes.</p>
        <div class="deploy-modal-actions">
          <button id="deploymentReset" class="btn">Reset</button>
          <button id="deploymentHome" class="btn secondary">Home</button>
        </div>
      </div>
    </div>
  </div>`;

  const grid = document.querySelector('#deploymentGrid');
  const stats = document.querySelector('#deploymentStats');
  const modal = document.querySelector('#deploymentResultModal');
  const scoreHeading = document.querySelector('#deploymentScore');

  const visibleLaneCount = deploymentLanes;
  const laneViews = lanes.slice(0, visibleLaneCount).map((lane) => {
    const laneElement = document.createElement('article');
    laneElement.className = 'deployment-lane';
    laneElement.innerHTML = `
      <div class="deployment-lane-overlay">
        <h3>Lane ${lane.id}</h3>
        <p data-lane-meta>0 / ${deploymentEpisodes}</p>
      </div>
      <canvas width="320" height="200" aria-label="Deployment lane ${lane.id}"></canvas>
    `;
    grid?.appendChild(laneElement);

    return {
      lane,
      laneElement,
      meta: laneElement.querySelector('[data-lane-meta]'),
      canvas: laneElement.querySelector('canvas'),
      context: laneElement.querySelector('canvas')?.getContext('2d')
    };
  });

  const openResults = () => {
    const progress = lanes.map((lane) => lane.getProgress());
    const score = createDeploymentScore(progress, deploymentEpisodes);
    if (scoreHeading) {
      scoreHeading.textContent = `You scored ${score.score} / ${score.maxScore}!`;
    }
    modal?.classList.remove('hidden');
    grid?.classList.add('collapsed');
  };

  const updateFrame = () => {
    let allDone = true;
    lanes.forEach((lane) => {
      lane.runTicks(deploymentSpeed);
      if (!lane.getProgress().done) allDone = false;
    });

    const progress = lanes.map((lane) => lane.getProgress());
    const completedEpisodes = progress.reduce((sum, lane) => sum + lane.completedEpisodes, 0);
    const totalEpisodes = deploymentLanes * deploymentEpisodes;
    const totalSuccesses = progress.reduce((sum, lane) => sum + lane.successes, 0);
    if (stats) {
      stats.textContent = `Runs ${completedEpisodes}/${totalEpisodes} · Finishes ${totalSuccesses}`;
    }

    for (const laneView of laneViews) {
      const laneProgress = laneView.lane.getProgress();
      if (laneView.meta) {
        laneView.meta.textContent = `${laneProgress.completedEpisodes} / ${laneProgress.episodesTarget} · ✅ ${laneProgress.successes}`;
      }
      if (laneView.context && laneView.canvas && laneProgress.transition) {
        const state = {
          mode,
          car: laneProgress.transition.car,
          track: laneProgress.transition.track,
          carCrashFrame: laneProgress.transition.event === 'crash' ? 2 : 0,
          trainingComplete: false
        };
        renderPolicyGradientCarScene(laneView.context, laneView.canvas, state);
      }
    }

    if (allDone) {
      deploymentLoopHandle = null;
      openResults();
      return;
    }

    deploymentLoopHandle = window.requestAnimationFrame(updateFrame);
  };

  deploymentLoopHandle = window.requestAnimationFrame(updateFrame);

  document.querySelector('#goHome')?.addEventListener('click', renderHomeScreen);
  document.querySelector('#deploymentHome')?.addEventListener('click', renderHomeScreen);
  document.querySelector('#deploymentReset')?.addEventListener('click', () => startSimulation(mode));
}

function drawWorld(ctx, canvas, state) {
  if (state.mode === 'advanced') {
    renderAdvancedSimulationScene(ctx, canvas, state);
  } else if (state.mode === 'pomdp') {
    renderPOMDPScene(ctx, canvas, state);
  } else if (state.mode === 'tribal') {
    renderTribalScene(ctx, canvas, state);
  } else if (state.mode === 'policy-gradient-car') {
    renderPolicyGradientCarScene(ctx, canvas, state);
  } else if (state.mode === 'ppo-figure-8') {
    renderPPOFigure8Scene(ctx, canvas, state);
  } else {
    renderSimpleSimulationScene(ctx, canvas, state);
  }
}

function stopSimulation() {
  simulationLoop.stop();
  if (deploymentLoopHandle !== null) {
    window.cancelAnimationFrame(deploymentLoopHandle);
    deploymentLoopHandle = null;
  }
  activeSimulation = null;
}

import { setupCanvas } from '../../shared/primitives/scenePrimitives.js';

function gaussianDensity(x, mu, sigma) {
  const s = Math.max(1e-6, sigma);
  return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mu) / s) ** 2);
}

export function pickCriticMood({ valueTrend = 0, advantageMean = 0, crashRate = 0, consecutiveLaps = 0 }) {
  if (consecutiveLaps > 40) return 'Don’t blow it now!';
  if (consecutiveLaps > 10) return 'Almost locked in…';
  if (crashRate > 0.6) return 'Too risky! Slow down!';
  if (Math.abs(advantageMean) < 0.05) return 'Right on track.';
  if (valueTrend > 0) return 'Looking good out there!';
  return 'Keep your line tight.';
}

export function renderPPOFigure8VisualizationPanel(state) {
  const p = state.policy;
  return `<div class="ppo-grid"><div><h4>Actor Brain</h4><canvas id="ppoActorBrain" width="300" height="220"></canvas></div>
  <div><h4>Critic Brain</h4><canvas id="ppoValueChart" width="300" height="90"></canvas><p>Critic Value V(s) Over Last Episode.</p><canvas id="ppoCriticBrain" width="300" height="130"></canvas></div>
  <div><h4>Actor Policy</h4><canvas id="ppoPolicyCurve" width="300" height="180"></canvas>
  <p>Episode ${p.episode} · Consecutive laps ${p.consecutiveLaps}</p>
  <p>LR actor ${p.actorLr.toExponential(2)} · LR critic ${p.criticLr.toExponential(2)}</p>
  <p>Clip ε ${p.clipEpsilon.toFixed(2)} · GAE mean ${p.lastAdvantageMean.toFixed(3)} · entropy ${p.entropyCoeff.toFixed(4)}</p></div></div>`;
}

function drawNetwork(ctx, canvas, network, labels = []) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const layers = [network.layerSizes[0], ...network.layers.map((l) => l.biases.length)];
  const nodes = layers.map((count, li) => Array.from({ length: count }, (_, i) => ({
    x: 30 + (li / (layers.length - 1)) * (canvas.width - 60),
    y: 20 + ((i + 1) / (count + 1)) * (canvas.height - 40)
  })));
  for (let li = 0; li < network.layers.length; li += 1) {
    const layer = network.layers[li];
    for (let o = 0; o < layer.weights.length; o += 1) {
      for (let i = 0; i < layer.weights[o].length; i += 1) {
        const w = layer.weights[o][i];
        const alpha = Math.min(1, Math.abs(w));
        ctx.strokeStyle = w >= 0 ? `rgba(37,99,235,${alpha})` : `rgba(220,38,38,${alpha})`;
        ctx.beginPath();
        ctx.moveTo(nodes[li][i].x, nodes[li][i].y);
        ctx.lineTo(nodes[li + 1][o].x, nodes[li + 1][o].y);
        ctx.stroke();
      }
    }
  }
  ctx.fillStyle = '#111827';
  nodes.forEach((layerNodes, li) => layerNodes.forEach((n, i) => {
    ctx.beginPath(); ctx.arc(n.x, n.y, 5, 0, Math.PI * 2); ctx.fill();
    if (li === 0 && labels[i]) { ctx.fillText(labels[i], n.x - 24, n.y - 8); }
  }));
}

export function drawPPOFigure8Panels(state, agent) {
  if (!agent || !agent.actor || !agent.critic) return;
  const actorCanvas = document.querySelector('#ppoActorBrain');
  const criticCanvas = document.querySelector('#ppoCriticBrain');
  const policyCanvas = document.querySelector('#ppoPolicyCurve');
  const valueCanvas = document.querySelector('#ppoValueChart');
  if (!(actorCanvas instanceof HTMLCanvasElement) || !(criticCanvas instanceof HTMLCanvasElement) || !(policyCanvas instanceof HTMLCanvasElement) || !(valueCanvas instanceof HTMLCanvasElement)) return;
  const aCtx = actorCanvas.getContext('2d'); const cCtx = criticCanvas.getContext('2d'); const pCtx = policyCanvas.getContext('2d'); const vCtx = valueCanvas.getContext('2d');
  if (!aCtx || !cCtx || !pCtx || !vCtx) return;

  drawNetwork(aCtx, actorCanvas, agent.actor, ['outer', 'inner', 'heading', 'theta', 'loop', 'speed']);
  drawNetwork(cCtx, criticCanvas, agent.critic);

  const values = state.policy.lastEpisodeValues || [];
  vCtx.clearRect(0, 0, valueCanvas.width, valueCanvas.height);
  vCtx.beginPath(); vCtx.strokeStyle = '#0f766e';
  values.forEach((val, i) => {
    const x = (i / Math.max(1, values.length - 1)) * valueCanvas.width;
    const y = valueCanvas.height / 2 - val * 8;
    if (i === 0) vCtx.moveTo(x, y); else vCtx.lineTo(x, y);
  });
  vCtx.stroke();

  pCtx.clearRect(0, 0, policyCanvas.width, policyCanvas.height);
  const { lastMu: mu, lastSigma: sigma, lastAction } = state.policy;
  let maxD = 0;
  for (let x = -30; x <= 30; x += 0.5) maxD = Math.max(maxD, gaussianDensity(x, mu, sigma));
  pCtx.beginPath(); pCtx.strokeStyle = '#1d4ed8';
  for (let x = 0; x <= policyCanvas.width; x += 1) {
    const ax = -30 + (60 * x) / policyCanvas.width;
    const y = policyCanvas.height - (gaussianDensity(ax, mu, sigma) / maxD) * (policyCanvas.height - 8);
    if (x === 0) pCtx.moveTo(x, y); else pCtx.lineTo(x, y);
  }
  pCtx.stroke();
  const actionX = ((lastAction + 30) / 60) * policyCanvas.width;
  pCtx.strokeStyle = '#dc2626'; pCtx.beginPath(); pCtx.moveTo(actionX, 0); pCtx.lineTo(actionX, policyCanvas.height); pCtx.stroke();
}

export function renderPPOFigure8Scene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);
  const t = state.track;
  context.fillStyle = '#7fc97f'; context.fillRect(0, 0, scene.width, scene.height);
  context.fillStyle = '#4b5563';
  const drawLoop = (center) => {
    context.beginPath();
    context.ellipse(center.x * scene.scaleX, center.y * scene.scaleY, t.outerRadiusX * scene.scaleX, t.outerRadiusY * scene.scaleY, 0, 0, Math.PI * 2);
    context.ellipse(center.x * scene.scaleX, center.y * scene.scaleY, t.innerRadiusX * scene.scaleX, t.innerRadiusY * scene.scaleY, 0, 0, Math.PI * 2, true);
    context.fill('evenodd');
  };
  drawLoop(t.leftCenter); drawLoop(t.rightCenter);
  context.fillStyle = '#4b5563';
  context.fillRect(t.corridor.xMin * scene.scaleX, t.corridor.yMin * scene.scaleY, (t.corridor.xMax - t.corridor.xMin) * scene.scaleX, (t.corridor.yMax - t.corridor.yMin) * scene.scaleY);

  context.save();
  context.translate(state.car.x * scene.scaleX, state.car.y * scene.scaleY);
  context.rotate((state.car.headingDeg * Math.PI) / 180 + Math.PI / 2);
  context.fillStyle = '#9f1239';
  context.fillRect(-10, -16, 20, 32);
  context.fillStyle = '#fecaca'; context.fillRect(-6, -10, 12, 10);
  context.restore();

  const bubbleAlpha = state.policy.bubbleAlpha ?? 1;
  context.fillStyle = '#8b5e34';
  context.fillRect(scene.width - 90, 20, 50, 35);
  context.fillRect(scene.width - 85, 55, 8, 30);
  context.fillRect(scene.width - 53, 55, 8, 30);
  context.fillStyle = '#fef3c7'; context.fillRect(scene.width - 78, 30, 24, 12);
  context.fillStyle = '#111827'; context.fillRect(scene.width - 68, 34, 4, 6);
  context.fillStyle = `rgba(255,255,255,${bubbleAlpha})`;
  context.fillRect(scene.width - 240, 8, 140, 30);
  context.fillStyle = `rgba(17,24,39,${bubbleAlpha})`;
  context.font = '12px Inter, sans-serif';
  context.fillText(state.policy.criticSpeech, scene.width - 235, 27);
}

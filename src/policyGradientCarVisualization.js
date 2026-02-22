function gaussianDensity(x, mu, sigma) {
  const safeSigma = Math.max(1e-6, sigma);
  const normalized = (x - mu) / safeSigma;
  return (1 / (safeSigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * normalized * normalized);
}

export function renderPolicyVisualizationPanel(state) {
  const policy = state.policy;
  return `<div id="policyVizPanel">
    <canvas id="policyGaussianCanvas" width="360" height="160" aria-label="Policy Gaussian curve"></canvas>
    <p><b>μ:</b> ${policy.lastMu.toFixed(3)} | <b>σ:</b> ${policy.lastSigma.toFixed(3)} | <b>Episode:</b> ${policy.episode} | <b>Consecutive completions:</b> ${policy.consecutiveCompletions}</p>
    <p><b>Timestep:</b> ${policy.timestep} | <b>Last return G:</b> ${policy.lastReturn.toFixed(3)} | <b>Loss:</b> ${policy.lastLoss.toFixed(4)}</p>
    <canvas id="policyLossCanvas" width="360" height="130" aria-label="Loss over episodes"></canvas>
  </div>`;
}

export function drawPolicyVisualization(state) {
  const gaussianCanvas = document.querySelector('#policyGaussianCanvas');
  const lossCanvas = document.querySelector('#policyLossCanvas');
  if (!(gaussianCanvas instanceof HTMLCanvasElement) || !(lossCanvas instanceof HTMLCanvasElement)) return;

  const gaussianContext = gaussianCanvas.getContext('2d');
  const lossContext = lossCanvas.getContext('2d');
  if (!gaussianContext || !lossContext) return;

  const { lastMu: mu, lastSigma: sigma, lastAction, lossHistory } = state.policy;
  gaussianContext.clearRect(0, 0, gaussianCanvas.width, gaussianCanvas.height);
  gaussianContext.fillStyle = '#f7fbff';
  gaussianContext.fillRect(0, 0, gaussianCanvas.width, gaussianCanvas.height);

  const minX = -30;
  const maxX = 30;
  let maxDensity = 0;
  for (let x = minX; x <= maxX; x += 0.5) {
    maxDensity = Math.max(maxDensity, gaussianDensity(x, mu, sigma));
  }
  maxDensity = Math.max(maxDensity, 1e-4);

  gaussianContext.strokeStyle = '#1d73e2';
  gaussianContext.lineWidth = 2;
  gaussianContext.beginPath();
  for (let pixelX = 0; pixelX <= gaussianCanvas.width; pixelX += 1) {
    const angle = minX + ((maxX - minX) * pixelX) / gaussianCanvas.width;
    const density = gaussianDensity(angle, mu, sigma);
    const pixelY = gaussianCanvas.height - (density / maxDensity) * (gaussianCanvas.height - 12);
    if (pixelX === 0) gaussianContext.moveTo(pixelX, pixelY);
    else gaussianContext.lineTo(pixelX, pixelY);
  }
  gaussianContext.stroke();

  const actionX = ((lastAction - minX) / (maxX - minX)) * gaussianCanvas.width;
  gaussianContext.strokeStyle = '#e03131';
  gaussianContext.lineWidth = 1.5;
  gaussianContext.beginPath();
  gaussianContext.moveTo(actionX, 0);
  gaussianContext.lineTo(actionX, gaussianCanvas.height);
  gaussianContext.stroke();

  lossContext.clearRect(0, 0, lossCanvas.width, lossCanvas.height);
  lossContext.fillStyle = '#f7fbff';
  lossContext.fillRect(0, 0, lossCanvas.width, lossCanvas.height);

  if (!lossHistory.length) return;
  const maxLoss = Math.max(...lossHistory.map((value) => Math.abs(value)), 0.01);
  lossContext.strokeStyle = '#0ca678';
  lossContext.lineWidth = 2;
  lossContext.beginPath();
  for (let i = 0; i < lossHistory.length; i += 1) {
    const x = (i / Math.max(1, lossHistory.length - 1)) * lossCanvas.width;
    const y = lossCanvas.height / 2 - (lossHistory[i] / maxLoss) * (lossCanvas.height / 2 - 8);
    if (i === 0) lossContext.moveTo(x, y);
    else lossContext.lineTo(x, y);
  }
  lossContext.stroke();
}

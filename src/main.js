import { FishingSimulation } from './simulation.js';

const app = document.querySelector('#app');
if (!app) throw new Error('Missing app');

app.innerHTML = `
<div class="layout">
  <header class="topbar glass">
    <div>
      <h1>🎣 RL Fishing Simulator</h1>
      <p class="subtitle">Epsilon-greedy day planning: lake vs river</p>
    </div>
    <button id="playPause" class="btn">Pause</button>
    <div id="stats" class="stats-pill"></div>
  </header>
  <main class="content">
    <section class="canvas-wrap glass">
      <canvas id="world" width="800" height="500" aria-label="Fishing world"></canvas>
    </section>
    <aside class="panel-column">
      <details open class="glass panel">
        <summary>🧠 Brain</summary>
        <div id="brain"></div>
      </details>
      <details open class="glass panel">
        <summary>📓 Journal</summary>
        <ul id="journal"></ul>
      </details>
    </aside>
  </main>
</div>`;

const sim = new FishingSimulation();
const canvas = document.querySelector('#world');
const ctx = canvas.getContext('2d');
const stats = document.querySelector('#stats');
const brainEl = document.querySelector('#brain');
const journalEl = document.querySelector('#journal');
const playPauseButton = document.querySelector('#playPause');

playPauseButton.addEventListener('click', () => {
  sim.togglePlay();
  playPauseButton.textContent = sim.getState().isPlaying ? 'Pause' : 'Play';
});

function drawScene() {
  const s = sim.getState();
  const rect = canvas.getBoundingClientRect();
  const dpr = devicePixelRatio || 1;
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const w = rect.width;
  const h = rect.height;
  const sx = w / 800;
  const sy = h / 500;
  const t = performance.now() / 1000;

  // Sky + lighting
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#9ad8ff');
  sky.addColorStop(0.5, '#d8f1ff');
  sky.addColorStop(1, '#f2fbff');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun
  const sunX = 90 * sx;
  const sunY = 90 * sy;
  const sunRadius = 36 * Math.min(sx, sy);
  const sun = ctx.createRadialGradient(sunX, sunY, 8, sunX, sunY, sunRadius * 2.2);
  sun.addColorStop(0, 'rgba(255,230,140,0.95)');
  sun.addColorStop(1, 'rgba(255,230,140,0)');
  ctx.fillStyle = sun;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  const ground = ctx.createLinearGradient(0, h * 0.4, 0, h);
  ground.addColorStop(0, '#95d17a');
  ground.addColorStop(1, '#6eb15f');
  ctx.fillStyle = ground;
  ctx.fillRect(0, h * 0.36, w, h * 0.64);

  drawLake(220 * sx, 170 * sy, 160 * sx, 110 * sy, t);
  drawRiver(470 * sx, 70 * sy, 210 * sx, 70 * sy, t);
  drawHouse(72 * sx, 258 * sy, 98 * sx, 78 * sy);
  drawMarket(390 * sx, 258 * sy, 128 * sx, 94 * sy);
  drawFisherman(s.fisherPosition.x * sx, s.fisherPosition.y * sy, t);

  const hour = String(Math.floor(s.minute / 60) % 24).padStart(2, '0');
  const minute = String(s.minute % 60).padStart(2, '0');
  stats.textContent = `Day ${s.day} · Time ${hour}:${minute} · 🐟 ${s.fishInventory} · 🪙 ${s.coins}`;

  brainEl.innerHTML = `
  <p><b>Epsilon</b>: ${s.brain.epsilon.toFixed(2)}</p>
  <p><b>Q(Lake)</b>: ${s.brain.qValues.lake.toFixed(2)} (${s.brain.visits.lake} visits)</p>
  <p><b>Q(River)</b>: ${s.brain.qValues.river.toFixed(2)} (${s.brain.visits.river} visits)</p>
  <p><b>Total Reward</b>: ${s.brain.totalReward} coins</p>`;

  journalEl.innerHTML = s.log.slice(0, 10).map((item) => `<li>${item}</li>`).join('');
}

function drawLake(x, y, w, h, t) {
  ctx.fillStyle = '#62b6ff';
  roundRect(x, y, w, h, 26, true);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    ctx.beginPath();
    const yy = y + 20 + i * 18;
    ctx.moveTo(x + 15, yy);
    for (let px = x + 15; px < x + w - 15; px += 16) {
      ctx.lineTo(px, yy + Math.sin((px + t * 80) / 20 + i) * 3);
    }
    ctx.stroke();
  }
  label('🌊 Lake', x + 12, y + 26);
}

function drawRiver(x, y, w, h, t) {
  const gradient = ctx.createLinearGradient(x, y, x + w, y + h);
  gradient.addColorStop(0, '#2f8fe8');
  gradient.addColorStop(1, '#55d0ff');
  ctx.fillStyle = gradient;
  roundRect(x, y, w, h, 30, true);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  for (let i = 0; i < 8; i += 1) {
    ctx.beginPath();
    ctx.ellipse(x + 22 + i * 22, y + 20 + Math.sin(t * 3 + i) * 4, 9, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  label('🏞️ River', x + 14, y + h - 14);
}

function drawHouse(x, y, w, h) {
  ctx.fillStyle = '#f6d39a';
  roundRect(x, y + h * 0.25, w, h * 0.75, 12, true);
  ctx.fillStyle = '#c06a4e';
  ctx.beginPath();
  ctx.moveTo(x - 8, y + h * 0.3);
  ctx.lineTo(x + w / 2, y - 18);
  ctx.lineTo(x + w + 8, y + h * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#6b4d2d';
  roundRect(x + w * 0.4, y + h * 0.58, w * 0.2, h * 0.42, 5, true);
  label('🏠 Home', x + 8, y + h + 18);
}

function drawMarket(x, y, w, h) {
  ctx.fillStyle = '#fefefe';
  roundRect(x, y + 10, w, h - 10, 10, true);
  ctx.fillStyle = '#ff6b6b';
  roundRect(x, y, w, 20, 6, true);
  ctx.fillStyle = '#fffcf2';
  for (let i = 0; i < 5; i += 1) {
    ctx.fillRect(x + i * (w / 5), y, w / 10, 20);
  }
  ctx.fillStyle = '#5f6f52';
  roundRect(x + w * 0.36, y + h * 0.45, w * 0.28, h * 0.4, 4, true);
  label('🧺 Market', x + 10, y + h + 18);
}
function drawFisherman(x, y, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#1f2937';
  ctx.beginPath();
  ctx.arc(0, -10, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-6, -2, 12, 16);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(6, 2);
  ctx.lineTo(22, -8 + Math.sin(t * 4) * 2);
  ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(24, -10 + Math.sin(t * 4) * 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '18px sans-serif';
  ctx.fillText('🎣', -8, -18);
  ctx.restore();
}

function label(text, x, y) {
  ctx.fillStyle = 'rgba(17,24,39,.75)';
  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillText(text, x, y);
}

function roundRect(x, y, width, height, radius, fill) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) ctx.fill();
}

setInterval(() => sim.tick(10), 220);
setInterval(drawScene, 120);

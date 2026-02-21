import { setupCanvas } from './scenePrimitives.js';

const ACTION_ICON = { hunt: '🏹', fish: '🐟', trade: '🤝', raid: '⚡' };
const STOCK_COLOR = { high: '#3f9f4d', medium: '#88b947', low: '#896037' };

function drawVillage(ctx, x, y, tribe, color, time) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i += 1) {
    const hx = x + (i % 2) * 30 - 20;
    const hy = y + Math.floor(i / 2) * 26;
    ctx.fillRect(hx, hy, 20, 16);
    ctx.beginPath();
    ctx.moveTo(hx - 2, hy);
    ctx.lineTo(hx + 10, hy - 12);
    ctx.lineTo(hx + 22, hy);
    ctx.closePath();
    ctx.fill();
  }

  const rep = tribe.reputation;
  ctx.lineWidth = 6;
  ctx.strokeStyle = rep >= 0 ? '#2f9e44' : '#e03131';
  ctx.beginPath();
  ctx.arc(x + 8, y + 18, 44, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * Math.abs(rep) / 100));
  ctx.stroke();

  const pile = Math.min(8, Math.floor(tribe.food / 30));
  ctx.fillStyle = '#f08c00';
  for (let i = 0; i < pile; i += 1) {
    ctx.fillRect(x - 50, y + 52 - i * 8, 12, 6);
  }

  ctx.font = '700 14px Inter, sans-serif';
  ctx.fillStyle = '#1f2937';
  ctx.fillText(tribe.name, x - 28, y - 16);
  const pulse = 2 * Math.sin(time / 240);
  ctx.fillText(`${ACTION_ICON[tribe.lastAction]} ${tribe.lastAction}`, x - 28, y - 30 + pulse);
}

function drawSparkline(ctx, points, color, x, y, w, h) {
  const max = Math.max(...points, 1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  points.forEach((point, index) => {
    const px = x + (index / Math.max(points.length - 1, 1)) * w;
    const py = y + h - (point / max) * h;
    if (index === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();
}

export function renderTribalScene(ctx, canvas, state) {
  const scene = setupCanvas(ctx, canvas);
  const { width, height } = scene;
  const sx = width / 800;
  const sy = height / 500;
  ctx.fillStyle = '#e8f7e8';
  ctx.fillRect(0, 0, width, height);

  drawVillage(ctx, 130 * sx, 300 * sy, { ...state.ashvari, name: 'Ashvari' }, '#c46b35', scene.time);
  drawVillage(ctx, 650 * sx, 300 * sy, { ...state.duskborn, name: 'Duskborn' }, '#317a7d', scene.time);

  ctx.fillStyle = STOCK_COLOR[state.forestStock];
  for (let i = 0; i < 7; i += 1) {
    const x = (340 + i * 20) * sx;
    const y = 130 * sy + (i % 2) * 14;
    ctx.fillRect(x - 5, y, 10, 16);
    ctx.beginPath();
    ctx.moveTo(x - 14, y);
    ctx.lineTo(x, y - 24);
    ctx.lineTo(x + 14, y);
    ctx.fill();
  }
  ctx.fillStyle = '#1f2937';
  ctx.fillText(`Forest: ${state.forestStock}`, 330 * sx, 88 * sy);

  ctx.fillStyle = state.riverStock === 'high' ? '#339af0' : state.riverStock === 'medium' ? '#4dabf7' : '#74c0fc';
  ctx.fillRect(285 * sx, 318 * sy, 250 * sx, (state.riverStock === 'high' ? 36 : state.riverStock === 'medium' ? 26 : 18) * sy);
  ctx.fillStyle = '#1f2937';
  ctx.fillText(`River: ${state.riverStock}`, 350 * sx, 308 * sy);

  const latest = state.jointHistory[0];
  if (latest) {
    ctx.font = '700 22px Inter, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.fillText(`${ACTION_ICON[latest.actionA]} ${latest.actionA} vs ${ACTION_ICON[latest.actionB]} ${latest.actionB}`, 280 * sx, 220 * sy);
  }

  drawSparkline(ctx, state.foodHistory.ashvari.slice().reverse(), '#d97706', 30 * sx, 455 * sy, 350 * sx, 35 * sy);
  drawSparkline(ctx, state.foodHistory.duskborn.slice().reverse(), '#0f766e', 420 * sx, 455 * sy, 350 * sx, 35 * sy);
}

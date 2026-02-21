import { setupCanvas } from './scenePrimitives.js';
import { drawSvg } from './tribalSceneArt.js';

const ACTION_ICON = { hunt: '🏹', fish: '🐟', trade: '🤝', raid: '⚡' };
const STOCK_COLOR = { high: '#2f9e44', medium: '#94d82d', low: '#8d6e63' };

function drawVillage(ctx, x, y, name, color) {
  ctx.fillStyle = color;
  for (let i = 0; i < 4; i += 1) {
    const hx = x + (i % 2) * 32 - 24;
    const hy = y + Math.floor(i / 2) * 26;
    ctx.fillRect(hx, hy, 22, 16);
    ctx.beginPath();
    ctx.moveTo(hx - 3, hy);
    ctx.lineTo(hx + 11, hy - 11);
    ctx.lineTo(hx + 25, hy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#1f2937';
  ctx.font = '700 14px Inter, sans-serif';
  ctx.fillText(name, x - 34, y - 16);
}

function drawTribeGroup(ctx, expedition, color, scaleX, scaleY, time) {
  const x = expedition.position.x * scaleX;
  const y = expedition.position.y * scaleY;
  const bob = Math.sin(time / 200) * 1.5;
  for (let i = 0; i < 3; i += 1) {
    const dx = (i - 1) * 14;
    drawSvg(ctx, 'villager', x - 16 + dx, y - 28 + bob, 24, 30);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.arc(x + dx - 4, y + 9, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#111827';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText(`${ACTION_ICON[expedition.action]} ${expedition.action}`, x - 24, y - 35);
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

function drawStockBadge(ctx, x, y, label, stock) {
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillRect(x, y, 130, 28);
  ctx.fillStyle = STOCK_COLOR[stock];
  ctx.fillRect(x + 5, y + 5, 18, 18);
  ctx.fillStyle = '#1f2937';
  ctx.font = '600 12px Inter, sans-serif';
  ctx.fillText(`${label}: ${stock}`, x + 30, y + 18);
}

export function renderTribalScene(ctx, canvas, state) {
  const scene = setupCanvas(ctx, canvas);
  const { width, height } = scene;
  const sx = width / 800;
  const sy = height / 500;

  if (!drawSvg(ctx, 'background', 0, 0, width, height)) {
    ctx.fillStyle = '#d8f2ff';
    ctx.fillRect(0, 0, width, height);
  }

  drawSvg(ctx, 'forest', 300 * sx, 100 * sy, 150 * sx, 120 * sy);
  drawSvg(ctx, 'river', 278 * sx, 286 * sy, 270 * sx, 95 * sy);
  drawSvg(ctx, 'trade', 350 * sx, 208 * sy, 90 * sx, 78 * sy);

  drawVillage(ctx, 130 * sx, 300 * sy, 'Ashvari', '#c46b35');
  drawVillage(ctx, 650 * sx, 300 * sy, 'Duskborn', '#317a7d');

  drawTribeGroup(ctx, state.expeditions.ashvari, '#f08c00', sx, sy, scene.time);
  drawTribeGroup(ctx, state.expeditions.duskborn, '#0f766e', sx, sy, scene.time + 300);

  drawStockBadge(ctx, 26 * sx, 24 * sy, 'Forest', state.forestStock);
  drawStockBadge(ctx, 26 * sx, 58 * sy, 'River', state.riverStock);

  drawSparkline(ctx, state.foodHistory.ashvari.slice().reverse(), '#d97706', 30 * sx, 455 * sy, 350 * sx, 35 * sy);
  drawSparkline(ctx, state.foodHistory.duskborn.slice().reverse(), '#0f766e', 420 * sx, 455 * sy, 350 * sx, 35 * sy);
}

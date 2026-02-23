import { drawFisher, drawHabitatEmblem, roundRect, setupCanvas } from '../../shared/primitives/scenePrimitives.js';
import { dominantBelief } from './pomdpBrain.js';

const LOCATIONS = {
  base: { x: 400, y: 430 },
  wetland: { x: 160, y: 200 },
  forest: { x: 400, y: 120 },
  savanna: { x: 640, y: 200 }
};

const HABITATS = ['wetland', 'forest', 'savanna'];
const BELIEF_COLOR = { low: '#2f9e44', medium: '#f59f00', high: '#e03131' };

function renderBeliefBar(context, x, y, belief) {
  const barWidth = 86;
  const barHeight = 8;
  roundRect(context, x - barWidth / 2, y, barWidth, barHeight, 4, true, false);

  const segments = [
    { key: 'low', color: '#69db7c' },
    { key: 'medium', color: '#ffd43b' },
    { key: 'high', color: '#ff8787' }
  ];

  let cursorX = x - barWidth / 2;
  for (const segment of segments) {
    const width = barWidth * (belief[segment.key] ?? 0);
    context.fillStyle = segment.color;
    context.fillRect(cursorX, y, width, barHeight);
    cursorX += width;
  }

  context.strokeStyle = 'rgba(18,18,18,0.45)';
  context.lineWidth = 1;
  roundRect(context, x - barWidth / 2, y, barWidth, barHeight, 4, false, true);
}

export function renderPOMDPScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);
  const bg = context.createLinearGradient(0, 0, 0, scene.height);
  bg.addColorStop(0, '#d8f3dc');
  bg.addColorStop(0.45, '#f4f1de');
  bg.addColorStop(1, '#c9d6a3');
  context.fillStyle = bg;
  context.fillRect(0, 0, scene.width, scene.height);

  context.fillStyle = 'rgba(53,94,59,0.2)';
  context.fillRect(0, scene.height * 0.4, scene.width, scene.height * 0.6);

  for (const habitat of HABITATS) {
    const belief = state.belief[habitat];
    const dominant = dominantBelief(belief);
    const loc = LOCATIONS[habitat];
    const x = loc.x * scene.scaleX;
    const y = loc.y * scene.scaleY;
    const radius = (44 + (dominant === 'medium' ? 10 : dominant === 'high' ? 18 : 0)) * Math.min(scene.scaleX, scene.scaleY);

    context.strokeStyle = BELIEF_COLOR[dominant];
    context.lineWidth = 8;
    context.globalAlpha = 0.24;
    context.beginPath();
    context.arc(x, y, radius + 7, 0, Math.PI * 2);
    context.stroke();
    context.globalAlpha = 1;

    const fill = context.createRadialGradient(x - 8, y - 10, 8, x, y, radius);
    fill.addColorStop(0, '#f1f3f5');
    fill.addColorStop(1, '#adb5bd');
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, y, radius, 0, Math.PI * 2);
    context.fill();

    drawHabitatEmblem(context, habitat, x, y, radius * 0.95);

    context.fillStyle = '#1f2937';
    context.font = '700 14px Inter, sans-serif';
    context.textAlign = 'center';
    context.fillText(habitat.toUpperCase(), x, y - radius - 10);

    renderBeliefBar(context, x, y + radius + 10, belief);

    if (!state.lastObservations[habitat]) {
      context.fillStyle = 'rgba(0,0,0,0.55)';
      context.beginPath();
      context.arc(x + radius * 0.5, y - radius * 0.5, 12, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#fff';
      context.font = '700 15px Inter, sans-serif';
      context.fillText('?', x + radius * 0.5, y - radius * 0.5 + 5);
    }
  }

  context.fillStyle = '#8d6e63';
  roundRect(context, (LOCATIONS.base.x - 60) * scene.scaleX, (LOCATIONS.base.y - 18) * scene.scaleY, 120 * scene.scaleX, 38 * scene.scaleY, 10);
  context.fillStyle = '#fff';
  context.font = '700 13px Inter, sans-serif';
  context.textAlign = 'center';
  context.fillText('BASE CAMP', LOCATIONS.base.x * scene.scaleX, (LOCATIONS.base.y + 4) * scene.scaleY);

  drawFisher(context, state.fisherPosition.x * scene.scaleX, state.fisherPosition.y * scene.scaleY, scene.time);
}

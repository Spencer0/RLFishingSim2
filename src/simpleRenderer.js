import { drawFisher, drawHouse, drawMarket, drawWater, paintWorldBackground, setupCanvas } from './scenePrimitives.js';

export function renderSimpleSimulationScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);
  paintWorldBackground(context, scene.width, scene.height);

  drawWater(context, {
    label: '🌊 Lake', x: 220 * scene.scaleX, y: 270 * scene.scaleY, width: 150 * scene.scaleX, height: 100 * scene.scaleY,
    colorA: '#6cc8ff', colorB: '#4298f0', time: scene.time
  });
  drawWater(context, {
    label: '🏞️ River', x: 470 * scene.scaleX, y: 170 * scene.scaleY, width: 170 * scene.scaleX, height: 60 * scene.scaleY,
    colorA: '#4ba3ff', colorB: '#2e7ad3', time: scene.time
  });
  drawWater(context, {
    label: '🌊 Ocean', x: 640 * scene.scaleX, y: 250 * scene.scaleY, width: 160 * scene.scaleX, height: 130 * scene.scaleY,
    colorA: '#1253ad', colorB: '#0a2f6b', time: scene.time
  });

  if (state.hasBoat) {
    context.font = '30px sans-serif';
    context.fillText('⛵', 720 * scene.scaleX, 312 * scene.scaleY);
  }

  drawHouse(context, 72 * scene.scaleX, 358 * scene.scaleY, 98 * scene.scaleX, 78 * scene.scaleY);
  drawMarket(context, 390 * scene.scaleX, 358 * scene.scaleY, 128 * scene.scaleX, 94 * scene.scaleY);
  drawFisher(context, state.fisherPosition.x * scene.scaleX, state.fisherPosition.y * scene.scaleY, scene.time);
}

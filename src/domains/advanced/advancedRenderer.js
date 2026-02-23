import { drawFisher, drawHouse, drawMarket, drawWater, paintWorldBackground, setupCanvas } from '../../shared/primitives/scenePrimitives.js';

export function renderAdvancedSimulationScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);
  paintWorldBackground(context, scene.width, scene.height);

  drawWater(context, {
    label: '🌊 Lake', x: 200 * scene.scaleX, y: 265 * scene.scaleY, width: 155 * scene.scaleX, height: 105 * scene.scaleY,
    colorA: '#78cbff', colorB: '#3f8ee0', time: scene.time, stockLevel: state.stockLevels.lake
  });
  drawWater(context, {
    label: '🏞️ River', x: 430 * scene.scaleX, y: 172 * scene.scaleY, width: 185 * scene.scaleX, height: 70 * scene.scaleY,
    colorA: '#58b3ff', colorB: '#2f7ad8', time: scene.time, stockLevel: state.stockLevels.river
  });
  drawWater(context, {
    label: '🌌 Deep Ocean', x: 630 * scene.scaleX, y: 238 * scene.scaleY, width: 170 * scene.scaleX, height: 150 * scene.scaleY,
    colorA: '#1560bf', colorB: '#08295f', time: scene.time, stockLevel: state.stockLevels.ocean
  });


  drawHouse(context, 72 * scene.scaleX, 358 * scene.scaleY, 98 * scene.scaleX, 78 * scene.scaleY);
  drawMarket(context, 390 * scene.scaleX, 358 * scene.scaleY, 128 * scene.scaleX, 94 * scene.scaleY);
  drawFisher(context, state.fisherPosition.x * scene.scaleX, state.fisherPosition.y * scene.scaleY, scene.time);
}

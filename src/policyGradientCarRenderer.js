import { setupCanvas } from './scenePrimitives.js';

function drawCar(context, x, y, headingRad) {
  context.save();
  context.translate(x, y);
  context.rotate(headingRad);
  context.fillStyle = '#1d4ed8';
  context.fillRect(-14, -8, 28, 16);
  context.fillStyle = '#93c5fd';
  context.fillRect(-7, -6, 14, 12);
  context.restore();
}

export function renderPolicyGradientCarScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);
  const trackTop = state.track.topWallY * scene.scaleY;
  const trackBottom = state.track.bottomWallY * scene.scaleY;

  context.fillStyle = '#e2e8f0';
  context.fillRect(0, 0, scene.width, scene.height);

  context.fillStyle = '#94a3b8';
  context.fillRect(0, trackTop, scene.width, trackBottom - trackTop);

  context.strokeStyle = '#0f172a';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(0, trackTop);
  context.lineTo(scene.width, trackTop);
  context.moveTo(0, trackBottom);
  context.lineTo(scene.width, trackBottom);
  context.stroke();

  const finishX = state.track.finishX * scene.scaleX;
  context.strokeStyle = '#16a34a';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(finishX, trackTop);
  context.lineTo(finishX, trackBottom);
  context.stroke();

  const headingRad = (state.car.headingDeg * Math.PI) / 180;
  drawCar(context, state.car.x * scene.scaleX, state.car.y * scene.scaleY, headingRad);

  if (state.trainingComplete) {
    context.fillStyle = 'rgba(15, 23, 42, 0.78)';
    context.fillRect(scene.width / 2 - 170, 20, 340, 52);
    context.fillStyle = '#fff';
    context.font = '700 24px Inter, sans-serif';
    context.textAlign = 'center';
    context.fillText('Training Complete', scene.width / 2, 54);
  }
}

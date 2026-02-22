import { setupCanvas } from './scenePrimitives.js';

let fireTireSprite = null;

function getFireTireSprite() {
  if (fireTireSprite) return fireTireSprite;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
    <defs>
      <radialGradient id="rim" cx="50%" cy="50%" r="60%">
        <stop offset="0%" stop-color="#374151"/>
        <stop offset="100%" stop-color="#111827"/>
      </radialGradient>
      <linearGradient id="fire" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stop-color="#f97316"/>
        <stop offset="55%" stop-color="#facc15"/>
        <stop offset="100%" stop-color="#fef3c7"/>
      </linearGradient>
    </defs>
    <circle cx="40" cy="50" r="20" fill="url(#rim)" stroke="#000" stroke-width="4"/>
    <circle cx="40" cy="50" r="8" fill="#9ca3af"/>
    <path d="M40 8 C24 18, 21 31, 30 42 C33 31, 40 28, 44 20 C45 29, 50 34, 56 41 C64 31, 60 18, 40 8 Z" fill="url(#fire)"/>
    <path d="M36 18 C31 23, 30 29, 34 35 C35 29, 37 26, 40 22 C41 26, 43 29, 46 33 C49 29, 48 23, 36 18 Z" fill="#fff7ed" opacity="0.8"/>
  </svg>`;

  fireTireSprite = new Image();
  fireTireSprite.src = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  return fireTireSprite;
}

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

function drawFireTires(context, state, scene) {
  const sprite = getFireTireSprite();
  const tires = state.track.fireTires ?? [];
  for (const tire of tires) {
    const size = tire.radius * 2.4;
    const x = tire.x * scene.scaleX - size / 2;
    const y = tire.y * scene.scaleY - size / 2;
    if (sprite.complete) {
      context.drawImage(sprite, x, y, size, size);
    } else {
      context.fillStyle = '#111827';
      context.beginPath();
      context.arc(tire.x * scene.scaleX, tire.y * scene.scaleY, tire.radius * scene.scaleX, 0, Math.PI * 2);
      context.fill();
    }
  }
}

function drawOvalTrack(context, state, scene) {
  const centerX = state.track.center.x * scene.scaleX;
  const centerY = state.track.center.y * scene.scaleY;
  const outerRadiusX = state.track.outerRadiusX * scene.scaleX;
  const outerRadiusY = state.track.outerRadiusY * scene.scaleY;
  const innerRadiusX = state.track.innerRadiusX * scene.scaleX;
  const innerRadiusY = state.track.innerRadiusY * scene.scaleY;

  context.fillStyle = '#475569';
  context.beginPath();
  context.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
  context.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2, true);
  context.fill('evenodd');

  context.strokeStyle = '#0f172a';
  context.lineWidth = 4;
  context.beginPath();
  context.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
  context.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = '#16a34a';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(centerX - 26, centerY - outerRadiusY);
  context.lineTo(centerX + 26, centerY - outerRadiusY);
  context.stroke();
}

export function renderPolicyGradientCarScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);

  context.fillStyle = '#e2e8f0';
  context.fillRect(0, 0, scene.width, scene.height);

  drawOvalTrack(context, state, scene);
  drawFireTires(context, state, scene);

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

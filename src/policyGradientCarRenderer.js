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

const supportsPath2D = typeof Path2D !== 'undefined';
const carSvg = supportsPath2D
  ? {
      body: new Path2D('M0 -26 C12 -26, 18 -20, 18 -12 L18 12 C18 20, 12 26, 0 26 C-12 26, -18 20, -18 12 L-18 -12 C-18 -20, -12 -26, 0 -26 Z'),
      hood: new Path2D('M-12 -24 L12 -24 L10 -8 L-10 -8 Z'),
      cabin: new Path2D('M-11 -6 C-9 -14, -4 -18, 0 -18 C4 -18, 9 -14, 11 -6 L9 9 C6 13, -6 13, -9 9 Z'),
      stripe: new Path2D('M-3 -24 L3 -24 L4 24 L-4 24 Z'),
      wheelLeftFront: new Path2D('M-20 -17 L-24 -17 L-24 -8 L-20 -8 Z'),
      wheelRightFront: new Path2D('M20 -17 L24 -17 L24 -8 L20 -8 Z'),
      wheelLeftRear: new Path2D('M-20 8 L-24 8 L-24 17 L-20 17 Z'),
      wheelRightRear: new Path2D('M20 8 L24 8 L24 17 L20 17 Z')
    }
  : null;

function drawHotRodCar(context, x, y, headingRad) {
  context.save();
  context.translate(x, y);
  context.rotate(headingRad + Math.PI / 2);

  if (carSvg) {
    context.fillStyle = '#9f1239';
    context.fill(carSvg.body);
    context.fillStyle = '#be123c';
    context.fill(carSvg.hood);
    context.fillStyle = '#fecaca';
    context.fill(carSvg.cabin);
    context.fillStyle = '#fef08a';
    context.fill(carSvg.stripe);
    context.fillStyle = '#111827';
    context.fill(carSvg.wheelLeftFront);
    context.fill(carSvg.wheelRightFront);
    context.fill(carSvg.wheelLeftRear);
    context.fill(carSvg.wheelRightRear);

    context.strokeStyle = '#3f0f20';
    context.lineWidth = 1.8;
    context.stroke(carSvg.body);
  } else {
    context.fillStyle = '#be123c';
    context.fillRect(-12, -20, 24, 40);
  }

  context.restore();
}

function drawCarExplosion(context, x, y, frame = 2) {
  const scale = frame === 2 ? 1 : 1.3;
  const alpha = frame === 2 ? 0.85 : 0.62;
  context.save();
  context.translate(x, y);
  context.scale(scale, scale);

  context.fillStyle = `rgba(255, 210, 60, ${alpha})`;
  context.beginPath();
  context.moveTo(0, -28);
  context.lineTo(9, -10);
  context.lineTo(26, -14);
  context.lineTo(14, 0);
  context.lineTo(26, 14);
  context.lineTo(8, 10);
  context.lineTo(0, 28);
  context.lineTo(-8, 10);
  context.lineTo(-26, 14);
  context.lineTo(-14, 0);
  context.lineTo(-26, -14);
  context.lineTo(-9, -10);
  context.closePath();
  context.fill();

  context.fillStyle = `rgba(239, 68, 68, ${alpha})`;
  context.beginPath();
  context.arc(0, 0, 11, 0, Math.PI * 2);
  context.fill();
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

function drawRaceBackground(context, scene, state) {
  const centerX = state.track.center.x * scene.scaleX;
  const centerY = state.track.center.y * scene.scaleY;
  const outerRadiusX = state.track.outerRadiusX * scene.scaleX;
  const outerRadiusY = state.track.outerRadiusY * scene.scaleY;

  context.fillStyle = '#7fc97f';
  context.fillRect(0, 0, scene.width, scene.height);

  context.fillStyle = '#4f9bd1';
  context.fillRect(0, 0, scene.width, scene.height * 0.16);
  context.fillRect(0, scene.height * 0.86, scene.width, scene.height * 0.14);

  context.fillStyle = 'rgba(15, 23, 42, 0.08)';
  context.font = '900 78px Inter, sans-serif';
  context.textAlign = 'center';
  context.fillText('RACER', scene.width / 2, scene.height / 2 + 24);

  context.strokeStyle = '#8b5e34';
  context.lineWidth = 4;
  context.setLineDash([9, 8]);
  context.beginPath();
  context.ellipse(centerX, centerY, outerRadiusX + 22, outerRadiusY + 22, 0, 0, Math.PI * 2);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#f8fafc';
  for (let i = 0; i < 56; i += 1) {
    const theta = (i / 56) * Math.PI * 2;
    const px = centerX + (outerRadiusX + 26) * Math.cos(theta);
    const py = centerY + (outerRadiusY + 26) * Math.sin(theta);
    context.fillRect(px - 2, py - 2, 4, 4);
  }
}

function drawOvalTrack(context, state, scene) {
  const centerX = state.track.center.x * scene.scaleX;
  const centerY = state.track.center.y * scene.scaleY;
  const outerRadiusX = state.track.outerRadiusX * scene.scaleX;
  const outerRadiusY = state.track.outerRadiusY * scene.scaleY;
  const innerRadiusX = state.track.innerRadiusX * scene.scaleX;
  const innerRadiusY = state.track.innerRadiusY * scene.scaleY;

  context.fillStyle = '#4b5563';
  context.beginPath();
  context.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
  context.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2, true);
  context.fill('evenodd');

  context.fillStyle = '#86efac';
  context.beginPath();
  context.ellipse(centerX, centerY, innerRadiusX - 10, innerRadiusY - 10, 0, 0, Math.PI * 2);
  context.fill();

  context.strokeStyle = '#d1d5db';
  context.lineWidth = 3;
  context.beginPath();
  context.ellipse(centerX, centerY, outerRadiusX, outerRadiusY, 0, 0, Math.PI * 2);
  context.ellipse(centerX, centerY, innerRadiusX, innerRadiusY, 0, 0, Math.PI * 2);
  context.stroke();

  context.strokeStyle = '#22c55e';
  context.lineWidth = 5;
  context.beginPath();
  context.moveTo(centerX - 30, centerY - outerRadiusY);
  context.lineTo(centerX + 30, centerY - outerRadiusY);
  context.stroke();
}

export function renderPolicyGradientCarScene(context, canvas, state) {
  const scene = setupCanvas(context, canvas);

  drawRaceBackground(context, scene, state);
  drawOvalTrack(context, state, scene);
  drawFireTires(context, state, scene);

  const headingRad = (state.car.headingDeg * Math.PI) / 180;
  const carX = state.car.x * scene.scaleX;
  const carY = state.car.y * scene.scaleY;

  if (state.carCrashFrame > 0) {
    drawHotRodCar(context, carX, carY, headingRad);
    drawCarExplosion(context, carX, carY, state.carCrashFrame);
  } else {
    drawHotRodCar(context, carX, carY, headingRad);
  }

  if (state.trainingComplete) {
    context.fillStyle = 'rgba(15, 23, 42, 0.78)';
    context.fillRect(scene.width / 2 - 170, 20, 340, 52);
    context.fillStyle = '#fff';
    context.font = '700 24px Inter, sans-serif';
    context.textAlign = 'center';
    context.fillText('Training Complete', scene.width / 2, 54);
  }
}

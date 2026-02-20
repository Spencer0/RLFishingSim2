export function setupCanvas(context, canvas) {
  const bounds = canvas.getBoundingClientRect();
  const pixelRatio = devicePixelRatio || 1;
  canvas.width = bounds.width * pixelRatio;
  canvas.height = bounds.height * pixelRatio;
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  return {
    width: bounds.width,
    height: bounds.height,
    scaleX: bounds.width / 800,
    scaleY: bounds.height / 500,
    time: performance.now() / 1000
  };
}

export function paintWorldBackground(context, width, height) {
  const skyGradient = context.createLinearGradient(0, 0, 0, height);
  skyGradient.addColorStop(0, '#9ad8ff');
  skyGradient.addColorStop(0.5, '#d8f1ff');
  skyGradient.addColorStop(1, '#f2fbff');
  context.fillStyle = skyGradient;
  context.fillRect(0, 0, width, height);

  const sunX = width * 0.12;
  const sunY = height * 0.15;
  const sunGlow = context.createRadialGradient(sunX, sunY, 8, sunX, sunY, 70);
  sunGlow.addColorStop(0, 'rgba(255,232,160,0.95)');
  sunGlow.addColorStop(1, 'rgba(255,232,160,0)');
  context.fillStyle = sunGlow;
  context.beginPath();
  context.arc(sunX, sunY, 70, 0, Math.PI * 2);
  context.fill();

  const groundGradient = context.createLinearGradient(0, height * 0.38, 0, height);
  groundGradient.addColorStop(0, '#97d880');
  groundGradient.addColorStop(1, '#6bad5f');
  context.fillStyle = groundGradient;
  context.fillRect(0, height * 0.36, width, height * 0.64);
}

export function roundRect(context, x, y, width, height, radius, fill = true, stroke = false) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
  if (fill) context.fill();
  if (stroke) context.stroke();
}

export function drawWater(context, { label, x, y, width, height, colorA, colorB, time, stockLevel }) {
  const waterGradient = context.createLinearGradient(x, y, x, y + height);
  waterGradient.addColorStop(0, colorA);
  waterGradient.addColorStop(1, colorB);
  context.fillStyle = waterGradient;
  roundRect(context, x, y, width, height, 26, true, false);

  context.strokeStyle = 'rgba(255,255,255,0.45)';
  context.lineWidth = 2;
  for (let waveRow = 0; waveRow < 5; waveRow += 1) {
    context.beginPath();
    const waveY = y + 16 + waveRow * (height / 6);
    context.moveTo(x + 10, waveY);
    for (let waveX = x + 10; waveX < x + width - 10; waveX += 14) {
      context.lineTo(waveX, waveY + Math.sin((waveX + time * 90) / 17 + waveRow) * 3.2);
    }
    context.stroke();
  }

  context.fillStyle = 'rgba(255,255,255,0.93)';
  context.font = '700 14px Inter, sans-serif';
  const stockFish = { low: '🐟', medium: '🐟🐟', high: '🐟🐟🐟' };
  context.fillText(label, x + 10, y + 22);
  if (stockLevel) {
    context.fillText(stockFish[stockLevel] ?? '', x + 10, y + 42);
  }
}

export function drawHouse(context, x, y, width, height) {
  context.save();
  context.translate(x, y);

  context.fillStyle = '#f3d4a4';
  roundRect(context, 0, height * 0.22, width, height * 0.78, 12);

  context.fillStyle = '#bf5944';
  context.beginPath();
  context.moveTo(-10, height * 0.3);
  context.lineTo(width / 2, -height * 0.18);
  context.lineTo(width + 10, height * 0.3);
  context.closePath();
  context.fill();

  context.fillStyle = '#fff3dd';
  roundRect(context, width * 0.12, height * 0.44, width * 0.2, height * 0.18, 4);
  roundRect(context, width * 0.66, height * 0.44, width * 0.2, height * 0.18, 4);

  context.fillStyle = '#6b4b31';
  roundRect(context, width * 0.42, height * 0.56, width * 0.18, height * 0.44, 4);

  context.fillStyle = '#83b96a';
  context.beginPath();
  context.arc(width * 0.05, height * 0.85, height * 0.12, 0, Math.PI * 2);
  context.arc(width * 0.95, height * 0.85, height * 0.12, 0, Math.PI * 2);
  context.fill();

  context.restore();
}

export function drawMarket(context, x, y, width, height) {
  context.save();
  context.translate(x, y);

  context.fillStyle = '#fff6eb';
  roundRect(context, 0, height * 0.2, width, height * 0.8, 12);

  context.fillStyle = '#ff6f61';
  roundRect(context, -4, 0, width + 8, height * 0.26, 8);

  context.fillStyle = '#fffdf4';
  for (let stripeIndex = 0; stripeIndex < 5; stripeIndex += 1) {
    roundRect(context, stripeIndex * (width / 5) + width * 0.06, height * 0.02, width * 0.08, height * 0.2, 4);
  }

  context.fillStyle = '#82ab5f';
  roundRect(context, width * 0.3, height * 0.54, width * 0.4, height * 0.38, 6);

  context.fillStyle = '#d18f3f';
  context.beginPath();
  context.arc(width * 0.2, height * 0.58, height * 0.08, 0, Math.PI * 2);
  context.arc(width * 0.8, height * 0.58, height * 0.08, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#4f6f47';
  context.font = `${Math.max(11, Math.round(height * 0.14))}px Inter, sans-serif`;
  context.fillText('MARKET', width * 0.24, height * 0.47);

  context.restore();
}

const supportsPath2D = typeof Path2D !== 'undefined';

const fisherSvgPaths = supportsPath2D
  ? {
      hat: new Path2D('M14 6 C19 2, 29 2, 33 6 L32 10 L14 10 Z'),
      head: new Path2D('M18 11 C18 7.8, 20.8 5, 24 5 C27.2 5, 30 7.8, 30 11 C30 14.2, 27.2 17, 24 17 C20.8 17, 18 14.2, 18 11 Z'),
      torso: new Path2D('M18 18 C20 17, 28 17, 30 18 L32 34 C29.5 37, 18.5 37, 16 34 Z'),
      collar: new Path2D('M20 19 L28 19 L27 23 L21 23 Z'),
      armBack: new Path2D('M18 20 C14 22, 14 30, 18 33 L20 31 C17 28, 17 24, 20 22 Z'),
      armFront: new Path2D('M30 20 C34 22, 34 30, 30 33 L28 31 C31 28, 31 24, 28 22 Z'),
      legBack: new Path2D('M19 34 L23 34 L21 48 L16 48 Z'),
      legFront: new Path2D('M25 34 L29 34 L32 48 L27 48 Z'),
      bootBack: new Path2D('M14 48 L22 48 L22 50 L12 50 Z'),
      bootFront: new Path2D('M26 48 L34 48 L36 50 L25 50 Z')
    }
  : null;

export function drawFisher(context, x, y, time) {
  context.save();
  context.translate(x, y - 12);

  if (fisherSvgPaths) {
    context.save();
    context.translate(-24, -28);

    context.fillStyle = '#2b1d0e';
    context.fill(fisherSvgPaths.hat);

    context.fillStyle = '#ffcf9f';
    context.fill(fisherSvgPaths.head);

    context.fillStyle = '#345a7f';
    context.fill(fisherSvgPaths.torso);

    context.fillStyle = '#f1f5f9';
    context.fill(fisherSvgPaths.collar);

    context.fillStyle = '#2f4e6d';
    context.fill(fisherSvgPaths.armBack);
    context.fill(fisherSvgPaths.armFront);

    context.fillStyle = '#4c3a2a';
    context.fill(fisherSvgPaths.legBack);
    context.fill(fisherSvgPaths.legFront);

    context.fillStyle = '#1f2937';
    context.fill(fisherSvgPaths.bootBack);
    context.fill(fisherSvgPaths.bootFront);

    context.strokeStyle = '#23364b';
    context.lineWidth = 1.2;
    context.stroke(fisherSvgPaths.torso);
    context.restore();
  } else {
    context.fillStyle = '#1f2937';
    context.beginPath();
    context.arc(0, -10, 8, 0, Math.PI * 2);
    context.fill();
    context.fillRect(-6, -2, 12, 16);
  }

  context.strokeStyle = '#2b6cb0';
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(7, -7);
  context.lineTo(30, -21 + Math.sin(time * 4) * 1.8);
  context.stroke();

  context.restore();
}

const habitatSvgShapes = supportsPath2D
  ? {
      wetland: {
        base: new Path2D('M10 28 C12 18, 20 12, 28 12 C36 12, 44 18, 46 28 C42 36, 34 40, 28 40 C22 40, 14 36, 10 28 Z'),
        accent: new Path2D('M28 10 C32 15, 33 20, 28 26 C23 20, 24 15, 28 10 Z')
      },
      forest: {
        base: new Path2D('M28 8 L40 24 L33 24 L44 38 L12 38 L23 24 L16 24 Z'),
        accent: new Path2D('M26 38 L26 28 L30 28 L30 38 Z')
      },
      savanna: {
        base: new Path2D('M10 30 C16 18, 26 14, 38 16 C42 20, 43 28, 40 34 C32 38, 20 38, 12 34 Z'),
        accent: new Path2D('M18 18 L20 10 L24 18 M30 18 L32 10 L36 18')
      }
    }
  : null;

export function drawHabitatEmblem(context, habitat, x, y, size = 48) {
  const shape = habitatSvgShapes?.[habitat];
  if (!shape) return;

  context.save();
  context.translate(x - size / 2, y - size / 2);
  context.scale(size / 56, size / 56);

  context.fillStyle = 'rgba(31, 41, 55, 0.14)';
  context.fill(shape.base);

  context.fillStyle = 'rgba(255, 255, 255, 0.78)';
  context.fill(shape.accent);

  context.strokeStyle = 'rgba(17, 24, 39, 0.5)';
  context.lineWidth = 1.5;
  context.stroke(shape.base);

  context.restore();
}

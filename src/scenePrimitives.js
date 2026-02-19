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
  context.fillText(`${label}${stockLevel ? ` · ${stockLevel.toUpperCase()}` : ''}`, x + 10, y + 22);
}

export function drawHouse(context, x, y, width, height) {
  context.fillStyle = '#f5d29b';
  roundRect(context, x, y + height * 0.23, width, height * 0.77, 12);
  context.fillStyle = '#c4654d';
  context.beginPath();
  context.moveTo(x - 8, y + height * 0.3);
  context.lineTo(x + width / 2, y - 18);
  context.lineTo(x + width + 8, y + height * 0.3);
  context.closePath();
  context.fill();
  context.fillStyle = '#704a2f';
  roundRect(context, x + width * 0.42, y + height * 0.58, width * 0.18, height * 0.42, 4);
}

export function drawMarket(context, x, y, width, height) {
  context.fillStyle = '#fff5ea';
  roundRect(context, x, y + 16, width, height - 16, 12);

  context.fillStyle = '#ff6b6b';
  roundRect(context, x, y, width, 24, 6);

  context.fillStyle = '#fffef8';
  for (let stripeIndex = 0; stripeIndex < 6; stripeIndex += 1) {
    context.fillRect(x + stripeIndex * (width / 6), y, width / 12, 24);
  }

  context.fillStyle = '#8ea56a';
  roundRect(context, x + width * 0.33, y + height * 0.5, width * 0.34, height * 0.38, 6);

  context.fillStyle = '#d58536';
  context.beginPath();
  context.arc(x + width * 0.22, y + height * 0.58, 7, 0, Math.PI * 2);
  context.arc(x + width * 0.78, y + height * 0.58, 7, 0, Math.PI * 2);
  context.fill();
}

export function drawFisher(context, x, y, time) {
  context.save();
  context.translate(x, y);
  context.fillStyle = '#1f2937';
  context.beginPath();
  context.arc(0, -10, 8, 0, Math.PI * 2);
  context.fill();
  context.fillRect(-6, -2, 12, 16);

  context.strokeStyle = '#2b6cb0';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(6, 2);
  context.lineTo(24, -8 + Math.sin(time * 4) * 2);
  context.stroke();
  context.restore();
}

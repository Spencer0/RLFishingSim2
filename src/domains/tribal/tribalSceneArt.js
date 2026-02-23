const SVG_ART = {
  background: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 500'>
    <defs>
      <linearGradient id='sky' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#9ad8ff'/><stop offset='75%' stop-color='#d8f2ff'/>
      </linearGradient>
      <linearGradient id='ground' x1='0' y1='0' x2='0' y2='1'>
        <stop offset='0%' stop-color='#93c47d'/><stop offset='100%' stop-color='#6a9d57'/>
      </linearGradient>
    </defs>
    <rect width='800' height='500' fill='url(#sky)'/>
    <ellipse cx='660' cy='80' rx='48' ry='26' fill='#fff7b3' opacity='0.9'/>
    <path d='M0 290 C130 250 270 310 390 285 C520 255 640 325 800 280 L800 500 L0 500 Z' fill='url(#ground)'/>
    <path d='M0 330 C220 290 450 340 800 300' stroke='#5f8e4d' stroke-width='26' fill='none' opacity='0.35'/>
    <path d='M0 358 C260 330 450 375 800 342' stroke='#4d7b40' stroke-width='30' fill='none' opacity='0.35'/>
  </svg>`,
  forest: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 130 120'>
    <rect x='57' y='72' width='15' height='36' fill='#654321'/>
    <circle cx='65' cy='48' r='34' fill='#2f8f46'/><circle cx='86' cy='58' r='23' fill='#3ea65a'/>
    <circle cx='42' cy='62' r='22' fill='#4bb564'/>
  </svg>`,
  river: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 240 110'>
    <path d='M10 70 C70 35 155 100 228 45' stroke='#2575c4' stroke-width='22' fill='none' stroke-linecap='round'/>
    <path d='M16 72 C74 38 155 98 220 50' stroke='#7ec8ff' stroke-width='11' fill='none' stroke-linecap='round'/>
  </svg>`,
  trade: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 140 120'>
    <rect x='24' y='50' width='92' height='52' rx='5' fill='#d4a15f'/>
    <polygon points='18,50 70,20 122,50' fill='#93562f'/>
    <rect x='60' y='70' width='20' height='32' fill='#7a4d2a'/>
    <circle cx='38' cy='74' r='5' fill='#f6d365'/><circle cx='102' cy='74' r='5' fill='#f6d365'/>
  </svg>`,
  villager: `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 56 72'>
    <circle cx='28' cy='15' r='10' fill='#f1c27d'/>
    <path d='M14 34 C20 22 36 22 42 34 L44 58 L12 58 Z' fill='#5c6bc0'/>
    <rect x='16' y='58' width='9' height='14' fill='#5d4037'/><rect x='31' y='58' width='9' height='14' fill='#5d4037'/>
  </svg>`
};

const cache = new Map();

function getImage(key) {
  if (typeof Image === 'undefined') return null;
  if (!cache.has(key)) {
    const img = new Image();
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(SVG_ART[key])}`;
    cache.set(key, img);
  }
  return cache.get(key);
}

export function drawSvg(ctx, key, x, y, width, height) {
  const img = getImage(key);
  if (!img || !img.complete) return false;
  ctx.drawImage(img, x, y, width, height);
  return true;
}

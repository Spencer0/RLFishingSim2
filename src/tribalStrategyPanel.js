const ACTIONS = ['hunt', 'fish', 'trade', 'raid'];
const COLOR = { hunt: '#8d6e63', fish: '#1971c2', trade: '#f59f00', raid: '#e03131' };

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function dist(items) {
  const total = items.length || 1;
  return ACTIONS.map((action) => ({ action, pct: (items.filter((a) => a === action).length / total) * 100 }));
}

function qVariance(row = {}) {
  const vals = ACTIONS.map((a) => row[a] ?? 0);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return vals.reduce((sum, v) => sum + (v - avg) ** 2, 0) / vals.length;
}

function policySummary(tribe) {
  const visits = tribe.brain.stateVisits ?? {};
  const qTable = tribe.brain.qTable ?? {};
  return Object.keys(visits)
    .sort((a, b) => (visits[b] ?? 0) - (visits[a] ?? 0))
    .slice(0, 5)
    .map((stateKey) => {
      const row = qTable[stateKey] ?? {};
      const action = ACTIONS.reduce((best, current) => (row[current] > (row[best] ?? 0) ? current : best), 'hunt');
      return `<li>${stateKey} → ${action} (Q: ${(row[action] ?? 0).toFixed(2)})</li>`;
    }).join('');
}

function renderChunkBars(label, actions) {
  return chunks(actions, 10).map((chunk, idx) => {
    const parts = dist(chunk);
    return `<div><small>${label} days ${idx * 10 + 1}-${idx * 10 + chunk.length}</small><div class="tribal-stacked">${parts.map((p) => `<span style="width:${p.pct}%;background:${COLOR[p.action]}"></span>`).join('')}</div></div>`;
  }).join('');
}

export function renderTribalStrategyPanel(state) {
  const currentA = state.ashvari.brain.qTable?.[state.ashvari.currentStateKey] ?? {};
  const currentB = state.duskborn.brain.qTable?.[state.duskborn.currentStateKey] ?? {};
  const varA = qVariance(currentA);
  const varB = qVariance(currentB);
  const exploreA = state.ashvari.brain.epsilon > 0.12 ? 'Exploring' : 'Exploiting';
  const exploreB = state.duskborn.brain.epsilon > 0.12 ? 'Exploring' : 'Exploiting';

  return `<h4>Action frequency over time</h4>
  <div class="tribal-grid-2"><div>${renderChunkBars('Ashvari', state.ashvari.brain.actionHistory)}</div><div>${renderChunkBars('Duskborn', state.duskborn.brain.actionHistory)}</div></div>
  <p><b>Q variance (current state):</b> Ashvari ${varA.toFixed(2)}, Duskborn ${varB.toFixed(2)}</p>
  <p><b>Epsilon:</b> Ashvari ${state.ashvari.brain.epsilon.toFixed(3)} (${exploreA}) · Duskborn ${state.duskborn.brain.epsilon.toFixed(3)} (${exploreB})</p>
  <div class="tribal-grid-2"><div><b>Ashvari policy</b><ul>${policySummary(state.ashvari)}</ul></div><div><b>Duskborn policy</b><ul>${policySummary(state.duskborn)}</ul></div></div>`;
}

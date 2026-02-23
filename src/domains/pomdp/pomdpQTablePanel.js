import { dominantBelief } from './pomdpBrain.js';

const HABITATS = ['wetland', 'forest', 'savanna'];
const LABELS = { low: 'Low', medium: 'Medium', high: 'High' };

function format(value) {
  return Number(value ?? 0).toFixed(2);
}

function renderBeliefTable(state) {
  const rows = HABITATS.map((habitat) => {
    const belief = state.belief[habitat];
    const dominant = dominantBelief(belief);
    const observation = state.lastObservations[habitat] ? ` · obs=${state.lastObservations[habitat]}` : '';

    return `
      <tr>
        <th scope="row">${habitat[0].toUpperCase()}${habitat.slice(1)}${observation}</th>
        <td>${format(belief.low)}</td>
        <td>${format(belief.medium)}</td>
        <td>${format(belief.high)}</td>
        <td><b>${LABELS[dominant]} ←</b></td>
      </tr>`;
  }).join('');

  return `
    <table class="qtable" aria-label="Belief state table">
      <thead><tr><th>Habitat</th><th>P(Low)</th><th>P(Medium)</th><th>P(High)</th><th>Dominant</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function renderBeliefQTable(state) {
  const qTable = state.brain.qTable ?? {};
  const keys = Object.keys(qTable).sort();
  const rows = keys.map((key) => {
    const rowClass = key === state.beliefKey ? ' class="qtable-current-state"' : '';
    const values = qTable[key] ?? { wetland: 0, forest: 0, savanna: 0 };
    return `<tr${rowClass}><th scope="row">${key}</th><td>${format(values.wetland)}</td><td>${format(values.forest)}</td><td>${format(values.savanna)}</td></tr>`;
  }).join('');

  return `
    <table class="qtable" aria-label="Q table over belief keys">
      <thead><tr><th>Belief Key</th><th>Wetland</th><th>Forest</th><th>Savanna</th></tr></thead>
      <tbody>${rows || '<tr><th scope="row">(none)</th><td>0.00</td><td>0.00</td><td>0.00</td></tr>'}</tbody>
    </table>`;
}

export function renderPOMDPQTablePanel(state) {
  const truth = HABITATS.map((habitat) => `${habitat}: <b>${state.truePrevalence[habitat]}</b>`).join(' · ');

  return `
    <div class="qtable-wrap" tabindex="0" aria-label="Scrollable pomdp panel">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start;">
        <section>
          <p class="qtable-caption">Belief State Table (posterior probabilities per habitat).</p>
          ${renderBeliefTable(state)}
        </section>
        <section>
          <p class="qtable-caption">Q Table over discretized belief keys. Current key: <b>${state.beliefKey}</b>.</p>
          ${renderBeliefQTable(state)}
          <p class="qtable-caption" style="margin-top:10px;">True Prevalence (hidden from agent): ${truth}</p>
        </section>
      </div>
    </div>`;
}

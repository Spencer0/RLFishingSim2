const ACTIONS = ['hunt', 'fish', 'trade', 'raid'];

function renderSingle(title, tribeState) {
  const qTable = tribeState.brain.qTable ?? {};
  const visits = tribeState.brain.stateVisits ?? {};
  const keys = Object.keys(qTable);
  const rows = keys.map((key) => {
    const best = ACTIONS.reduce((bestAction, action) => (qTable[key][action] > qTable[key][bestAction] ? action : bestAction), 'hunt');
    const cls = key === tribeState.currentStateKey ? ' class="qtable-current-state"' : '';
    return `<tr${cls}><th>${key}</th>${ACTIONS.map((action) => `<td class="${action === best ? 'tribal-best-q' : ''}">${(qTable[key][action] ?? 0).toFixed(2)}</td>`).join('')}<td>${visits[key] ?? 0}</td></tr>`;
  }).join('');

  return `<div><h4>${title}</h4><div class="qtable-wrap"><table class="qtable"><thead><tr><th>State</th>${ACTIONS.map((a) => `<th>${a}</th>`).join('')}<th>Visits</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}

function actionDist(history = []) {
  const count = { hunt: 0, fish: 0, trade: 0, raid: 0 };
  const sample = history.slice(-100);
  sample.forEach((a) => { count[a] += 1; });
  return Object.entries(count).map(([k, v]) => ({ action: k, pct: sample.length ? (v / sample.length) * 100 : 0 }));
}

function renderBars(label, dist) {
  return `<div><b>${label}</b>${dist.map((item) => `<div>${item.action}<div class="tribal-bar"><span style="width:${item.pct.toFixed(1)}%"></span></div></div>`).join('')}</div>`;
}

export function renderTribalQTablePanel(state) {
  return `<div class="tribal-grid-2">${renderSingle('Ashvari', state.ashvari)}${renderSingle('Duskborn', state.duskborn)}</div>
  <div class="tribal-grid-2">${renderBars('Ashvari action distribution', actionDist(state.ashvari.brain.actionHistory))}${renderBars('Duskborn action distribution', actionDist(state.duskborn.brain.actionHistory))}</div>`;
}

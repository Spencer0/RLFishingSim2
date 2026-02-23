import { detectNashEquilibrium } from './tribalSimulation.js';

const COLOR = { hunt: '#8d6e63', fish: '#1971c2', trade: '#f59f00', raid: '#e03131' };

function actionCounts(history, sideKey) {
  return history.reduce((acc, item) => {
    acc[item[sideKey]] = (acc[item[sideKey]] ?? 0) + 1;
    return acc;
  }, {});
}

export function renderTribalRelationsPanel(state) {
  const week = state.jointHistory.slice(0, 7);
  const month = state.jointHistory.slice(0, 30);
  const weekA = actionCounts(week, 'actionA');
  const weekB = actionCounts(week, 'actionB');
  const monthTrades = month.filter((d) => d.actionA === 'trade' && d.actionB === 'trade').length;
  const weekRaids = (weekA.raid ?? 0) + (weekB.raid ?? 0);

  const squares = month.slice().reverse().map((day) => `<div class="tribal-history-day"><span style="background:${COLOR[day.actionA]}"></span><span style="background:${COLOR[day.actionB]}"></span></div>`).join('');

  const exploit = state.jointHistory.filter((d) => (d.actionA === 'raid' && d.actionB === 'trade') || (d.actionA === 'trade' && d.actionB === 'raid')).length;
  const coop = state.jointHistory.filter((d) => d.actionA === 'trade' && d.actionB === 'trade').length;
  const arms = state.jointHistory.filter((d) => d.actionA === 'raid' && d.actionB === 'raid').length;
  const safe = state.jointHistory.filter((d) => ['hunt', 'fish'].includes(d.actionA) && ['hunt', 'fish'].includes(d.actionB)).length;
  const nash = detectNashEquilibrium(state);

  return `<p>The Ashvari and Duskborn are in a ${monthTrades > 12 ? 'fragile truce' : 'volatile rivalry'}. Trade appeared ${monthTrades} times in the last 30 days, with ${weekRaids} raids this week.</p>
  <div class="tribal-history-grid">${squares}</div>
  <p>Mutual cooperation: ${coop} · Exploitation: ${exploit} · Arms race: ${arms} · Safe harvest: ${safe}</p>
  <p>${nash ? `⚠️ Possible Nash equilibrium detected: both tribes defaulting to ${nash}.` : 'No dominant Nash-like lock-in detected in the last 20 days.'}</p>`;
}

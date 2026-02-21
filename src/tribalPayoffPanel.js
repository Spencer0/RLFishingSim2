const ACTIONS = ['hunt', 'fish', 'trade', 'raid'];
const PAYOFF = {
  hunt: { hunt: [10, 10], fish: [10, 8], trade: [10, 10], raid: [4, 14] },
  fish: { hunt: [8, 10], fish: [8, 8], trade: [8, 10], raid: [2, 14] },
  trade: { hunt: [10, 10], fish: [10, 8], trade: [16, 16], raid: [-4, 14] },
  raid: { hunt: [14, 4], fish: [14, 2], trade: [14, -4], raid: [-6, -6] }
};

function repLabel(rep) {
  if (rep > 30) return 'Trusted';
  if (rep < -30) return 'Feared';
  return 'Neutral';
}

export function renderTribalPayoffPanel(state) {
  const latest = state.jointHistory[0];
  const rows = ACTIONS.map((actionA) => {
    const cols = ACTIONS.map((actionB) => {
      const [a, b] = PAYOFF[actionA][actionB];
      const cls = a < 0 && b < 0 ? 'tribal-negative' : (a > 12 && b > 12 ? 'tribal-positive' : (Math.abs(a - b) > 8 ? 'tribal-asym' : ''));
      const highlight = latest && latest.actionA === actionA && latest.actionB === actionB ? ' qtable-current-state' : '';
      return `<td class="${cls}${highlight}">(${a}, ${b})</td>`;
    }).join('');
    return `<tr><th>${actionA}</th>${cols}</tr>`;
  }).join('');

  return `<p class="qtable-caption">Matrix rewards before stock/reputation modifiers.</p>
  <table class="qtable"><thead><tr><th>A \ B</th>${ACTIONS.map((a) => `<th>${a}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  <p><b>Outcome map:</b> trade+trade = cooperation, raid+trade = exploitation, raid+raid = mutual harm, hunt/fish combos = safe harvest.</p>
  <p><b>Reputation:</b> Ashvari ${state.ashvari.reputation} (${repLabel(state.ashvari.reputation)}), Duskborn ${state.duskborn.reputation} (${repLabel(state.duskborn.reputation)}).</p>`;
}

const ACTIONS = ['lake', 'river', 'ocean'];
const STOCK_LEVELS = ['l', 'm', 'h'];
const STOCK_LABEL = { l: 'Low', m: 'Medium', h: 'High' };

function formatQValue(value) {
  return Number(value ?? 0).toFixed(2);
}

function buildAdvancedStateKeys() {
  const keys = [];
  for (const lake of STOCK_LEVELS) {
    for (const river of STOCK_LEVELS) {
      for (const ocean of STOCK_LEVELS) {
        keys.push(`${lake}${river}${ocean}`);
      }
    }
  }
  return keys;
}

export function renderQTablePanel(state) {
  if (state.mode === 'advanced') {
    return renderAdvancedQTable(state);
  }

  return renderSimpleQTable(state);
}

function renderSimpleQTable(state) {
  const qValues = state.brain.qValues ?? { lake: 0, river: 0, ocean: 0 };
  const visits = state.brain.visits ?? { lake: 0, river: 0, ocean: 0 };
  const availability = {
    lake: 'active',
    river: 'active',
    ocean: state.hasBoat ? 'active' : 'locked'
  };

  return `
    <p class="qtable-caption">Simple mode has a single shared state and per-action Q values.</p>
    <div class="qtable-wrap" tabindex="0" aria-label="Scrollable simple Q table">
      <table class="qtable" aria-label="Simple simulation Q table">
        <thead>
          <tr><th>State</th><th>Lake</th><th>River</th><th>Ocean</th></tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">Q Value</th>
            <td>${formatQValue(qValues.lake)}</td>
            <td>${formatQValue(qValues.river)}</td>
            <td>${formatQValue(qValues.ocean)}</td>
          </tr>
          <tr>
            <th scope="row">Visits</th>
            <td>${visits.lake ?? 0}</td>
            <td>${visits.river ?? 0}</td>
            <td>${visits.ocean ?? 0}</td>
          </tr>
          <tr>
            <th scope="row">Status</th>
            <td>${availability.lake}</td>
            <td>${availability.river}</td>
            <td>${availability.ocean}</td>
          </tr>
        </tbody>
      </table>
    </div>`;
}

function getVerboseStateLabel(stateKey) {
  return `Lake ${STOCK_LABEL[stateKey[0]]} · River ${STOCK_LABEL[stateKey[1]]} · Ocean ${STOCK_LABEL[stateKey[2]]}`;
}

function renderAdvancedQTable(state) {
  const currentKey = `${state.stockLevels.lake[0]}${state.stockLevels.river[0]}${state.stockLevels.ocean[0]}`;
  const qTable = state.brain.qTable ?? {};
  const stateKeys = buildAdvancedStateKeys();

  const rows = stateKeys.map((stateKey) => {
    const rowClass = stateKey === currentKey ? ' class="qtable-current-state"' : '';
    return `
      <tr${rowClass}>
        <th scope="row">${getVerboseStateLabel(stateKey)}</th>
        <td>${formatQValue(qTable[stateKey]?.lake)}</td>
        <td>${formatQValue(qTable[stateKey]?.river)}</td>
        <td>${formatQValue(qTable[stateKey]?.ocean)}</td>
      </tr>`;
  }).join('');

  return `
    <p class="qtable-caption">Advanced mode tracks state rows and action columns. Each row names Lake/River/Ocean stock levels explicitly, and the highlighted row is the current state.</p>
    <div class="qtable-wrap" tabindex="0" aria-label="Scrollable advanced Q table">
      <table class="qtable" aria-label="Advanced simulation Q table">
        <thead>
          <tr><th>State</th><th>Lake</th><th>River</th><th>Ocean</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

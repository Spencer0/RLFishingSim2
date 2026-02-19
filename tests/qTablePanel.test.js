import { describe, expect, it } from 'vitest';
import { renderQTablePanel } from '../src/qTablePanel.js';

describe('renderQTablePanel', () => {
  it('renders simple simulation table with action columns and status row', () => {
    const html = renderQTablePanel({
      mode: 'simple',
      hasBoat: false,
      brain: {
        qValues: { lake: 2, river: 5.5, ocean: 1 },
        visits: { lake: 3, river: 5, ocean: 0 }
      }
    });

    expect(html).toContain('Simple simulation Q table');
    expect(html).toContain('<th>Lake</th><th>River</th><th>Ocean</th>');
    expect(html).toContain('<th scope="row">Q Value</th>');
    expect(html).toContain('<td>5.50</td>');
    expect(html).toContain('<th scope="row">Status</th>');
    expect(html).toContain('<td>locked</td>');
  });

  it('renders advanced matrix with one row per state and highlighted current state', () => {
    const html = renderQTablePanel({
      mode: 'advanced',
      stockLevels: { lake: 'high', river: 'medium', ocean: 'low' },
      brain: {
        qTable: {
          hml: { lake: 1.2, river: 2.34, ocean: 0.1 },
          lll: { lake: -0.2, river: 0, ocean: 0.7 }
        }
      }
    });

    expect(html).toContain('Advanced simulation Q table');
    expect(html).toContain('<th scope="row">HML</th>');
    expect(html).toContain('<td>2.34</td>');
    expect((html.match(/qtable-current-state/g) ?? []).length).toBe(1);
    expect((html.match(/<tr/g) ?? []).length - 1).toBe(27);
  });
});

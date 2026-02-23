import { describe, expect, it } from 'vitest';
import { renderMathPanel } from '../src/domains/simple/mathPanel.js';

describe('renderMathPanel', () => {
  it('renders the Q-learning formula and explanatory sections', () => {
    const html = renderMathPanel();

    expect(html).toContain('Q(s,a)');
    expect(html).toContain("reward + γ · max Q(s'");
    expect(html).toContain('Symbol Guide');
    expect(html).toContain('Why this works');
  });
});

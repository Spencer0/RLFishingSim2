import { describe, expect, it } from 'vitest';
import { renderPolicyGradientCarMathPanel } from '../src/domains/policyGradientCar/policyGradientCarMathPanel.js';

describe('renderPolicyGradientCarMathPanel', () => {
  it('renders policy gradient formula and key terms', () => {
    const html = renderPolicyGradientCarMathPanel();

    expect(html).toContain('Policy Gradient Update (REINFORCE)');
    expect(html).toContain('θ + α · G');
    expect(html).toContain('log π');
    expect(html).toContain('burning tires');
  });
});

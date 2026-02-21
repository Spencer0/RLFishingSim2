export function renderTribalMathPanel() {
  return `<article class="math-panel">
  <h3>Multi-Agent Q-Learning</h3>
  <p class="math-formula"><span>Q_A(s,a) ← Q_A(s,a) + α(r_A + γ·max Q_A(s',a') - Q_A(s,a))</span></p>
  <p class="math-formula"><span>Q_B(s,b) ← Q_B(s,b) + α(r_B + γ·max Q_B(s',b') - Q_B(s,b))</span></p>
  <p>Each tribe learns independently, but state includes the other tribe's last action.</p>
  <h4>Non-Stationarity</h4><p>Because each tribe is learning, transition and reward dynamics keep drifting from each tribe's perspective.</p>
  <h4>Payoff Matrix</h4><p>Trade+Trade is cooperative upside; Raid tempts short-term gain; Raid+Raid is destructive.</p>
  <h4>Nash Equilibrium</h4><p>A Nash equilibrium is a joint strategy where unilateral deviation does not improve reward. In this matrix, multiple local locks can appear empirically; Q-learning does not guarantee Nash convergence.</p>
  <h4>Commons Problem</h4><p>Hunt and Fish consume shared stocks, so social cooperation can still fail ecologically if extraction is unbalanced.</p>
  </article>`;
}

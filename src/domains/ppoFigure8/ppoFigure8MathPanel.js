export function renderPPOFigure8MathPanel() {
  return `<article class="math-panel">
    <h3>PPO-Clip Update with GAE</h3>
    <p class="math-formula">L = E[min(r(θ)A, clip(r(θ),1-ε,1+ε)A)] - c<sub>v</sub>(V-R)<sup>2</sup> + c<sub>e</sub>H</p>
    <ul class="math-symbols">
      <li><b>r(θ)</b>: exp(new log π - old log π)</li>
      <li><b>A</b>: normalized GAE(γ=0.99, λ=0.95)</li>
      <li><b>ε</b>: clip range (0.2)</li>
      <li><b>V(s)</b>: critic value estimate</li>
    </ul>
  </article>`;
}

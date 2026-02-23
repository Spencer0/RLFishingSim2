export function renderPolicyGradientCarMathPanel() {
  return `
    <article class="math-panel">
      <h3>Policy Gradient Update (REINFORCE)</h3>
      <p class="math-formula" aria-label="Policy gradient update formula">
        <span>θ</span>
        <span class="math-arrow">←</span>
        <span>θ + α · G<sub>t</sub> · ∇<sub>θ</sub> log π<sub>θ</sub>(a<sub>t</sub>|s<sub>t</sub>)</span>
      </p>

      <h4>Symbol Guide</h4>
      <ul class="math-symbols">
        <li><b>θ</b>: Neural-network weights that define the steering policy.</li>
        <li><b>α</b> (alpha): Learning rate for each gradient step.</li>
        <li><b>G<sub>t</sub></b>: Discounted return from timestep <i>t</i> onward.</li>
        <li><b>π<sub>θ</sub>(a|s)</b>: Probability density of selecting steering action <i>a</i> in state <i>s</i>.</li>
        <li><b>∇<sub>θ</sub> log π<sub>θ</sub>(a|s)</b>: Direction that makes sampled good actions more likely.</li>
      </ul>

      <h4>How this drives the car</h4>
      <p>
        The policy outputs Gaussian parameters (<b>μ</b> and <b>σ</b>) and samples steering actions each frame.
        If an episode earns positive return, the update pushes the network toward repeating those actions;
        for crashes (including hitting burning tires), the return is negative so those actions become less likely.
      </p>
      <p>
        Over many episodes, this repeated gradient ascent shapes a controller that balances lane-keeping
        and obstacle avoidance to reliably finish the track.
      </p>
    </article>`;
}

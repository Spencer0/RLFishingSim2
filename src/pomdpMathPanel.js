export function renderPOMDPMathPanel() {
  return `
    <article class="math-panel">
      <h3>Belief Update (Bayes Rule)</h3>
      <p class="math-formula" aria-label="Bayes rule belief update">
        <span>b'(s')</span>
        <span class="math-arrow">=</span>
        <span>P(o | s') · b(s) / P(o)</span>
      </p>
      <ul class="math-symbols">
        <li><b>b(s)</b>: prior belief over hidden prevalence state before observing a sample.</li>
        <li><b>P(o | s')</b>: observation likelihood from the sensor model.</li>
        <li><b>b'(s')</b>: posterior belief after combining prior and evidence.</li>
        <li><b>P(o)</b>: normalizing constant so probabilities sum to 1.</li>
      </ul>

      <h4>The POMDP tuple</h4>
      <p class="math-formula" aria-label="POMDP tuple"><span>(S, A, T, R, Ω, O, γ)</span></p>
      <ul class="math-symbols">
        <li><b>S</b>: hidden prevalence levels {low, medium, high} for each habitat.</li>
        <li><b>A</b>: choose which habitat to visit next (wetland, forest, savanna).</li>
        <li><b>T</b>: transition model for prevalence drift overnight.</li>
        <li><b>R</b>: intervention points earned from sampling true prevalence.</li>
        <li><b>Ω</b>: observed signal bucket {low, medium, high} sick-animal counts.</li>
        <li><b>O</b>: observation model mapping hidden truth to noisy signals.</li>
        <li><b>γ</b>: discount factor for long-run value in Q-learning.</li>
      </ul>

      <h4>Why belief state, not true state</h4>
      <p>
        The agent never observes true prevalence directly. It only sees noisy observation signals,
        so it must carry forward a belief distribution that summarizes relevant history.
        This belief is a sufficient statistic for future control decisions.
      </p>
      <p>
        In the fully observable Q-learning simulation, state was directly visible; here the agent must infer state.
      </p>

      <h4>Q-learning over belief space</h4>
      <p class="math-formula" aria-label="Q learning over belief key">
        <span>Q(b,a)</span>
        <span class="math-arrow">←</span>
        <span>Q(b,a) + α · (reward + γ · max Q(b',a') - Q(b,a))</span>
      </p>
      <p>
        We discretize each habitat belief to its dominant level and form a compact belief key (for example, <b>hlm</b>).
        This approximation loses some detail but keeps learning practical and interpretable.
      </p>
    </article>`;
}

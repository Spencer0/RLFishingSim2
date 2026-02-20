export function renderMathPanel() {
  return `
    <article class="math-panel">
      <h3>Q-Learning Update Rule</h3>
      <p class="math-formula" aria-label="Q learning update formula">
        <span>Q(s,a)</span>
        <span class="math-arrow">←</span>
        <span>Q(s,a) + α · (reward + γ · max Q(s',a') - Q(s,a))</span>
      </p>

      <h4>Symbol Guide</h4>
      <ul class="math-symbols">
        <li><b>Q(s,a)</b>: Current estimate of how good action <i>a</i> is in state <i>s</i>.</li>
        <li><b>α</b> (alpha): Learning rate. Controls how quickly new evidence changes old beliefs.</li>
        <li><b>reward</b>: Immediate coins gained from the action just taken.</li>
        <li><b>γ</b> (gamma): Discount factor. Weighs the value of future opportunities.</li>
        <li><b>max Q(s',a')</b>: Best predicted value available from the next state <i>s'</i>.</li>
        <li><b>Q(s,a) on the right</b>: Subtracted to form a correction term (prediction error).</li>
      </ul>

      <h4>Why this works</h4>
      <p>
        This equation is a feedback correction loop. The term
        <b>(reward + γ · max Q(s',a') - Q(s,a))</b> measures how surprised the agent is: positive when the outcome
        was better than expected, negative when it was worse.
      </p>
      <p>
        Multiplying that surprise by <b>α</b> makes learning stable: larger α learns faster but can be noisy,
        smaller α learns slower but is smoother. Over many trips, repeating this update drives Q-values toward
        action values that balance immediate fish value and future stock-aware opportunities.
      </p>
      <p>
        In plain language: keep a score for each state-action choice, compare prediction vs outcome,
        nudge the score, and repeat. That repeated nudging is the core math behind policy improvement.
      </p>
    </article>`;
}

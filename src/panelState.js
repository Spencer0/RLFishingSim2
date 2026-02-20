export function buildPanelRenderKey(state) {
  if (state.mode === 'advanced') {
    const currentStateKey = `${state.stockLevels.lake[0]}${state.stockLevels.river[0]}${state.stockLevels.ocean[0]}`;
    return JSON.stringify({
      day: state.day,
      minute: state.minute,
      fishInventory: state.fishInventory,
      coins: state.coins,
      isPlaying: state.isPlaying,
      stockLevels: state.stockLevels,
      replenishTimers: state.replenishTimers,
      brain: {
        epsilon: state.brain.epsilon,
        alpha: state.brain.alpha,
        gamma: state.brain.gamma,
        visitedStates: state.brain.visitedStates,
        totalReward: state.brain.totalReward,
        currentRow: state.brain.qTable?.[currentStateKey],
        qTable: state.brain.qTable
      },
      log: state.log.slice(0, 10)
    });
  }

  return JSON.stringify({
    day: state.day,
    minute: state.minute,
    fishInventory: state.fishInventory,
    coins: state.coins,
    hasBoat: state.hasBoat,
    isPlaying: state.isPlaying,
    brain: state.brain,
    log: state.log.slice(0, 10)
  });
}

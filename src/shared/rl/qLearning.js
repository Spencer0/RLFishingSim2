export function chooseEpsilonGreedyAction({ actionValuesByName, actionNames, explorationRate, randomValue = Math.random() }) {
  if (!actionNames.length) {
    throw new Error('chooseEpsilonGreedyAction requires at least one action name.');
  }

  if (randomValue < explorationRate) {
    const explorationIndex = Math.floor((randomValue / explorationRate) * actionNames.length);
    return actionNames[Math.min(explorationIndex, actionNames.length - 1)];
  }

  return actionNames.reduce((bestActionName, candidateActionName) => (
    actionValuesByName[candidateActionName] > actionValuesByName[bestActionName] ? candidateActionName : bestActionName
  ), actionNames[0]);
}

export function computeTemporalDifferenceUpdatedQValue({ currentQValue, rewardValue, learningRate, discountFactor, maxNextQValue }) {
  return currentQValue + learningRate * (rewardValue + discountFactor * maxNextQValue - currentQValue);
}

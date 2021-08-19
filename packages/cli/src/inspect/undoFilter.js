// @ts-check

/** @typedef {import('./types').State} State */

/**
 *
 * @param {State} state
 * @param {function} buildStats
 * @param {function} home
 */
const undoFilter = async (state, buildStats, home) => {
  const { filters } = state;
  if (filters.length > 0) {
    filters.pop();
  }
  await buildStats(state);
  console.log();
  home();
};

module.exports = undoFilter;

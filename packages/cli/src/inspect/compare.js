// @ts-check

const { diffLines } = require('diff');
const { dump: yamlDump } = require('js-yaml');

/** @typedef {import('./types').Console} Console */
/** @typedef {import('./types').State} State */

/**
 * @param {Console} rl
 * @param {State} state
 * @param {function} buildBaseStats
 * @param {function} home
 */
const compare = async (rl, state, buildBaseStats, home) => {
  const baseState = await buildBaseStats();

  const baseComparableState = yamlDump(baseState.stats.toComparableState());
  const workingComparableState = yamlDump(state.stats.toComparableState());

  const diff = diffLines(baseComparableState, workingComparableState);

  console.log(diff);

  rl.question(
    `Press enter to continue: `,
    // eslint-disable-next-line consistent-return
    () => home()
  );
};

module.exports = compare;

// @ts-check

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
  console.log(baseState);

  rl.question(
    `Press enter to continue: `,
    // eslint-disable-next-line consistent-return
    () => home()
  );
};

module.exports = compare;

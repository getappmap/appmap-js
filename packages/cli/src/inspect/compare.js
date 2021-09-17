// @ts-check

const { diffLines } = require('diff');
const { dump: yamlDump } = require('js-yaml');

const FgGreen = '\x1b[32m';
const FgMagenta = '\x1b[35m';
const FgWhite = '\x1b[37m';

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

  diff.forEach((entry) => {
    // eslint-disable-next-line no-nested-ternary
    const color = entry.added ? FgGreen : entry.removed ? FgMagenta : FgWhite;
    entry.value.split('\n').forEach((line) => {
      if (line.trim() === '') {
        return;
      }
      console.log(`%s%s\x1b[0m`, color, line);
    });
  });

  rl.question(
    `Press enter to continue: `,
    // eslint-disable-next-line consistent-return
    () => home()
  );
};

module.exports = compare;

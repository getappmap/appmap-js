// @ts-check

/** @typedef {import('./types').State} State */

/**
 * @param {State} state
 * @param {function} home
 */
const compare = (state, home) => {
  return home();
};

module.exports = compare;

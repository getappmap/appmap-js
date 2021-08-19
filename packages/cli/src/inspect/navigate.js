// @ts-check

const { Table } = require('console-table-printer');

/** @typedef {import('./types').Console} Console */
/** @typedef {import('./types').State} State */

/**
 * @param {Console} rl
 * @param {State} state
 * @param {function} findCodeObjects
 * @param {function} home
 */
const navigate = (rl, state, findCodeObjects, home) => {
  const { stats: functionStats } = state;
  const dsTable = new Table({
    title: 'Navigate to object',
    columns: [
      {
        name: 'index',
        title: 'Index',
      },
      {
        name: 'type',
        title: 'Type',
      },
      {
        name: 'name',
        title: 'Name',
      },
    ],
  });
  const { references } = functionStats;
  references.forEach((reference, index) => {
    dsTable.addRow(
      {
        index: index + 1,
        type: reference.type,
        name: reference.name,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  dsTable.printTable();

  rl.question(
    `Reference (${references
      .map((_reference, i) => i + 1)
      .join(',')}) or (h)ome ? `,
    async (num) => {
      if (num === 'h') {
        return home();
      }
      const reference = references[parseInt(num, 10) - 1];
      if (!reference) {
        return navigate(rl, state, findCodeObjects, home);
      }
      state.codeObjectId = [reference.type, reference.name].join(':');
      await findCodeObjects(state);
      console.log();
      return home();
    }
  );
};

module.exports = navigate;

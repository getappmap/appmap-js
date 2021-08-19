// @ts-check

const { Table } = require('console-table-printer');
const Fields = require('./fields');

/** @typedef {import('./types').State} State */
/** @typedef {import('./types').Console} Console */

const filterFields = Fields.fields.filter((f) => f.filterName);

/**
 * @param {Console} rl
 * @param {State} state
 * @param {function} buildStats
 * @param {function} home
 */
const filter = (rl, state, buildStats, home) => {
  const { filters, stats } = state;
  const filterFieldIndexes = Fields.selectIndexes(
    filterFields.map((f) => f.name)
  );
  const dsTable = new Table({
    title: 'Filter data set',
    columns: [
      {
        name: 'index',
        title: 'Index',
      },
      {
        name: 'name',
        title: 'Name',
      },
    ],
  });
  filterFields.forEach((field, index) => {
    dsTable.addRow(
      {
        index: filterFieldIndexes[index] + 1,
        name: field.title,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  dsTable.printTable();

  rl.question(
    `Data set (${filterFieldIndexes.map((i) => i + 1).join(',')}) or (h)ome ? `,
    async (num) => {
      if (num === 'h') {
        return home();
      }
      const filterField = Fields.fieldFromIndex(parseInt(num, 10) - 1);

      function retry() {
        filter(rl, state, buildStats, home);
      }

      if (!filterField || !filterField.filterName) {
        return retry();
      }

      const statsValues = stats[filterField.name];
      if (!statsValues) {
        return retry();
      }

      const valueTable = new Table({
        title: filterField.title,
        columns: [
          {
            name: 'index',
            title: 'Index',
          },
          {
            name: 'value',
            title: 'Value',
          },
        ],
      });
      statsValues.forEach((value, index) => {
        valueTable.addRow(
          {
            index: index + 1,
            value,
          },
          { color: index % 2 === 0 ? 'white' : 'cyan' }
        );
      });
      valueTable.printTable();

      return rl.question(
        `Choose ${filterField.title} filter (${statsValues
          .map((_, index) => index + 1)
          .join(',')}), or (h)ome ? `,
        // eslint-disable-next-line consistent-return
        async (index) => {
          if (index === 'h') {
            return home();
          }

          const value = statsValues[parseInt(index, 10) - 1];
          if (value) {
            const newFilter = { name: filterField.filterName, value };
            filters.push(newFilter);
            await buildStats(state);
            console.log();
            home();
          } else {
            retry();
          }
        }
      );
    }
  );
};

module.exports = filter;

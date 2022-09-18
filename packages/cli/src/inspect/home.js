// @ts-ignore
const { Table } = require('console-table-printer');
const Fields = require('./fields');

/** @typedef {import('../search/types').FunctionStats} FunctionStats */
/** @typedef {import('./types').Filter} Filter */
/** @typedef {import('./context').default} Context */

const MAX_VALUE_LENGTH = 60;

/**
 * @param {Context} context
 * @param {function(): void} getCommand
 */
const home = (context, getCommand) => {
  if (context.filters.length > 0) {
    console.log('Filters:');
    console.log(context.filters.map((filter) => `${filter.name} = ${filter.value}`).join('\n'));
    console.log();
  }

  if (context.saves.length > 0) {
    console.log('Saved ids:');
    console.log(context.saves.join('\n'));
    console.log();
  }

  const table = new Table({
    title: context.codeObjectId,
    columns: [
      { name: 'index', alignment: 'left', title: 'Index' },
      { name: 'name', alignment: 'left', title: 'Name' },
      { name: 'values', alignment: 'left', maxLen: 50, title: 'Value' },
    ],
  });

  Fields.fields.forEach((field, index) => {
    const values = context.stats[field.name];
    let printValue = null;
    if (values) {
      printValue = values.length;
      if (values.length > 0) {
        if (typeof values[0] === 'string') {
          const valueString = values.join(', ');
          if (valueString.length < MAX_VALUE_LENGTH) {
            printValue = valueString;
          }
        }
      }
    }

    table.addRow(
      {
        index: index + 1,
        name: field.title,
        values: printValue,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
  getCommand();
};

module.exports = home;

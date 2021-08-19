// @ts-ignore
const { Table } = require('console-table-printer');
const Fields = require('./fields');

/** @typedef {import('../search/types').EventMatch} EventMatch */
/** @typedef {import('../search/types').FunctionStats} FunctionStats */
/** @typedef {import('./types').Field} Field */

/**
 * @param {Field} field
 * @param {import('../search/types').FunctionStats} functionStats
 */
function eventMatches(field, functionStats) {
  const table = new Table({
    title: field.title,
    columns: [
      {
        name: 'name',
        title: 'Name',
        maxLen: 60,
      },
      {
        name: 'eventId',
        title: 'Event',
      },
    ],
  });
  functionStats.eventMatches.forEach((eventMatch, index) => {
    table.addRow(
      {
        name: [eventMatch.appmap, 'appmap.json'].join('.'),
        eventId: eventMatch.event.id,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
}

/**
 * @param {Field} field
 * @param {FunctionStats} functionStats
 */
function printValues(field, functionStats) {
  const table = new Table({
    title: field.title,
    columns: [
      {
        name: 'value',
        title: field.valueTitle || 'Value',
        maxLen: 80,
      },
    ],
  });
  functionStats[field.name].forEach((value, index) => {
    table.addRow(
      {
        value,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
}

/**
 * @param {Field} field
 * @param {FunctionStats} functionStats
 */
function packageTrigrams(field, functionStats) {
  const table = new Table({
    title: field.title,
    columns: [
      {
        name: 'caller',
        alignment: 'left',
        title: 'Caller',
        maxLen: 30,
      },
      {
        name: 'package',
        alignment: 'left',
        title: 'Package',
        maxLen: 30,
      },
      {
        name: 'callee',
        alignment: 'left',
        title: 'Callee',
        maxLen: 30,
      },
    ],
  });
  functionStats.packageTrigrams.forEach((t, index) => {
    table.addRow(
      {
        caller: t.callerId,
        package: t.codeObjectId,
        callee: t.calleeId,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
}

/**
 * @param {Field} field
 * @param {FunctionStats} functionStats
 */
function classTrigrams(field, functionStats) {
  const table = new Table({
    title: field.title,
    columns: [
      {
        name: 'caller',
        alignment: 'left',
        title: 'Caller',
        maxLen: 30,
      },
      {
        name: 'class',
        alignment: 'left',
        title: 'Class',
        maxLen: 30,
      },
      {
        name: 'callee',
        alignment: 'left',
        title: 'Callee',
        maxLen: 30,
      },
    ],
  });
  functionStats.classTrigrams.forEach((t, index) => {
    table.addRow(
      {
        caller: t.callerId,
        class: t.codeObjectId,
        callee: t.calleeId,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
}

/**
 * @param {Field} field
 * @param {FunctionStats} functionStats
 */
function functionTrigrams(field, functionStats) {
  // eslint-disable-next-line no-shadow
  const table = new Table({
    title: field.title,
    columns: [
      {
        name: 'caller',
        alignment: 'left',
        title: 'Caller',
        maxLen: 30,
      },
      {
        name: 'function',
        alignment: 'left',
        title: 'Function',
        maxLen: 30,
      },
      {
        name: 'callee',
        alignment: 'left',
        title: 'Callee',
        maxLen: 30,
      },
    ],
  });
  functionStats.functionTrigrams.forEach((t, index) => {
    table.addRow(
      {
        caller: t.callerId,
        function: t.codeObjectId,
        callee: t.calleeId,
      },
      { color: index % 2 === 0 ? 'white' : 'cyan' }
    );
  });
  table.printTable();
}

const printFields = Fields.fields;
const printFieldIndexes = Fields.selectIndexes(printFields.map((f) => f.name));

const commands = {
  eventMatches,
  packageTrigrams,
  classTrigrams,
  functionTrigrams,
};

/**
 *
 * @param {FunctionStats} functionStats
 * @param {any} rl
 * @param {function(): void} getCommand
 * @param {function(): void} home
 */
function print(functionStats, rl, getCommand, home) {
  const retry = () => {
    print(functionStats, rl, getCommand, home);
  };

  rl.question(
    `Data set (${printFieldIndexes.map((i) => i + 1).join(',')}) or (h)ome ? `,
    // eslint-disable-next-line consistent-return
    (/** @type {string} */ num) => {
      if (num === 'h') {
        return home();
      }
      const printField = Fields.fieldFromIndex(parseInt(num, 10) - 1);
      if (!printField) {
        return retry();
      }
      const action = commands[printField.name] || printValues;
      action(printField, functionStats);
      getCommand();
    }
  );
}

module.exports = print;

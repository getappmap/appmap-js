/* eslint-disable no-inner-declarations */
import sqliteParser from 'sqlite-parser';

// eslint-disable-next-line import/prefer-default-export
export function notNull(event) {
  return event !== null && event !== undefined;
}

export function compareEvents(first, second) {
  const diff = first.kind.localeCompare(second.kind);
  if (diff !== 0) {
    return diff;
  }

  return JSON.stringify(first).localeCompare(JSON.stringify(second));
}

export function uniqueEvents() {
  const set = new Set();
  return (event) => {
    const eventStr = JSON.stringify(event, null, 2);
    if (!set.has(eventStr)) {
      set.add(eventStr);
      return event;
    }
    return null;
  };
}

function parseNormalizeSQL(sql) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  try {
    const ast = sqliteParser(parseSQL);
    const actions = [];
    const columns = [];
    const tables = [];

    function parse(statement) {
      const tokens = ['type', 'variant']
        .map((propertyName) => statement[propertyName])
        .filter((value) => value);

      const key = tokens.join('.');
      // eslint-disable-next-line no-use-before-define
      let parser = parsers[key];
      if (!parser) {
        // eslint-disable-next-line no-use-before-define
        parser = parseStatement;
      }

      const parserList = Array.isArray(parser) ? parser : [parser];
      parserList.forEach((prs) => prs(statement));
    }

    function parseStatement(statement) {
      const reservedWords = ['type', 'variant', 'name', 'value'];
      Object.keys(statement)
        .filter((property) => !reservedWords.includes(property))
        .map((propertyName) => statement[propertyName])
        .forEach((property) => {
          if (Array.isArray(property)) {
            property.forEach(parse);
          } else if (typeof property === 'object') {
            parse(property);
          } else if (
            typeof property === 'string' ||
            typeof property === 'boolean'
          ) {
            // pass
          } else {
            console.warn(
              `Unrecognized subexpression: ${typeof property} ${property}`
            );
          }
        });
    }

    function parseList(listElements, statement) {
      listElements.forEach((listElement) => {
        const subExpression = statement[listElement];
        if (Array.isArray(subExpression)) {
          subExpression.forEach(parse);
        } else if (typeof subExpression === 'object') {
          parse(subExpression);
        } else {
          console.warn(`Unrecognized subexpression: ${subExpression}`);
        }
      });
    }
    const nop = () => {};
    function parseIdentifierExpression(statement) {
      if (statement.format === 'table') {
        tables.push(statement.name);
      }
      parseList(['columns'], statement);
    }
    function recordAction(action) {
      return () => {
        actions.push(action);
      };
    }

    const parsers = {
      'literal.text': nop,
      'literal.decimal': nop,
      'identifier.star': (statement) => columns.push(statement.name),
      'identifier.column': (statement) => columns.push(statement.name),
      'identifier.table': (statement) => tables.push(statement.name),
      'identifier.expression': parseIdentifierExpression,
      'statement.select': [recordAction('select'), parseStatement],
      'statement.insert': [recordAction('insert'), parseStatement],
      'statement.update': [recordAction('update'), parseStatement],
      'statement.delete': [recordAction('delete'), parseStatement],
    };

    parse(ast);

    function unique(list) {
      return [...new Set(list)];
    }
    const uniqueActions = unique(actions).sort();

    const result = {};
    if (uniqueActions.length === 1) {
      // eslint-disable-next-line prefer-destructuring
      result.action = uniqueActions[0];
    } else if (actions.length > 0) {
      result.actions = uniqueActions;
    }

    return Object.assign(result, {
      tables: unique(tables).sort(),
      columns: unique(columns).sort(),
    });
  } catch (e) {
    // console.warn(`Unable to parse ${parseSQL} : ${e.message}`);
    return null;
  }
}

function dumbNormalizeSQL(sql) {
  const sqlLower = sql.toLowerCase();
  const stopWords = ['where', 'limit', 'order by', 'group by', 'values', 'set'];
  const stopWordLocations = stopWords
    .map((word) => sqlLower.indexOf(` ${word}`))
    .filter((index) => index !== -1)
    .sort();
  if (stopWordLocations.length > 0) {
    const subSQL = sql.slice(0, stopWordLocations[0] - 1);
    return subSQL.replace(
      /\s([\w_]+)\(\s+'?[w\d]+'?\)\s+\)(?:\s|^)/g,
      '$1(...)'
    );
  }

  console.warn(`Unparseable: ${sql}`);
  return 'Unparseable';
}

/**
 * It's essential to normalize SQL to remove trivial differences like WHERE clauses on
 * generated id values, timestamps, etc.
 *
 * @param {string} sql
 */
export function normalizeSQL(sql) {
  return parseNormalizeSQL(sql) || dumbNormalizeSQL(sql);
}

export function buildTree(events) {
  const eventsById = events
    .filter((event) => event.id)
    .reduce((memo, value) => {
      // eslint-disable-next-line no-param-reassign
      memo[value.id] = value;
      return memo;
    }, {});

  const rootEvents = events.reduce((roots, event) => {
    // An event with no parent is a root.
    // When an event has a parent, but the parent cannot be located in the tree,
    // assign the event to the previous known event
    let parentId = event.parent_id;
    if (!parentId) {
      roots.push(event);
      return roots;
    }

    let parent = eventsById[parentId];
    while (!parent && parentId >= 0) {
      parentId -= 1;
      parent = eventsById[parentId];
    }

    if (parent) {
      if (!parent.children) {
        parent.children = [event];
      } else {
        parent.children.push(event);
      }
    } else {
      roots.push(event);
    }

    return roots;
  }, []);

  events.forEach((event) => {
    // eslint-disable-next-line no-param-reassign
    delete event.id;
    // eslint-disable-next-line no-param-reassign
    delete event.parent_id;
  });

  return rootEvents;
}

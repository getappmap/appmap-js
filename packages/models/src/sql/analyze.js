/* eslint-disable no-inner-declarations */
import normalize from './normalize';
import parseAST from './parse';

export default function analyze(sql, errorCallback = () => {}) {
  const ast = parseAST(sql, errorCallback);
  if (!ast) {
    return null;
  }

  const actions = [];
  const columns = [];
  const tables = [];
  let joins = 0;

  function parseQuery(statement) {
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
          property.forEach(parseQuery);
        } else if (typeof property === 'object') {
          parseQuery(property);
        } else if (typeof property === 'string' || typeof property === 'boolean') {
          // pass
        } else {
          console.warn(`Unrecognized subexpression: ${typeof property} ${property}`);
        }
      });
  }

  function parseList(listElements, statement) {
    listElements.forEach((listElement) => {
      const subExpression = statement[listElement];
      if (Array.isArray(subExpression)) {
        subExpression.forEach(parseQuery);
      } else if (typeof subExpression === 'object') {
        parseQuery(subExpression);
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
    'statement.pragma': nop,
    'map.join': [
      (statement) => {
        joins += statement.map.length;
      },
      parseStatement,
    ],
  };

  parseQuery(ast);

  function unique(list) {
    return [...new Set(list)];
  }
  const uniqueActions = unique(actions).sort();

  return {
    actions: uniqueActions,
    tables: unique(tables).sort(),
    columns: unique(columns).sort(),
    joinCount: joins,
  };
}

// returns a JSON of SQL query AST with all literals replaced by variables and all variable names
// removed. If the query cannot be parsed, returns a best-effort normalized SQL string.
export function abstractSqlAstJSON(query, databaseType) {
  const ast = parseAST(query);
  if (!ast) return normalize(query, databaseType);

  return JSON.stringify(ast, (_, value) => {
    if (value === null) return null;

    switch (value.type) {
      case 'variable':
      case 'literal':
        return { type: 'variable' };
      default:
        return value;
    }
  });
}

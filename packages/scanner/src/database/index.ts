// License: https://github.com/newrelic/newrelic-ruby-agent/blob/main/LICENSE
// Apache License 2.0

// TODO: Copied and TypeScript-ified from @appland/models

import { visit } from './visit';
import { Event, /* getSqlLabelFromString, */ SqlQuery } from '@appland/models';
import { AppMapIndex, EventFilter, QueryAST } from '../types';
import { URL } from 'url';

const COMPONENTS_REGEXP_MAP: Record<string, RegExp> = {
  single_quotes: /'(?:[^']|'')*?(?:\\'.*|'(?!'))/g,
  double_quotes: /"(?:[^"]|"")*?(?:\\".*|"(?!"))/g,
  dollar_quotes: /(\$(?!\d)[^$]*?\$).*?(?:\1|$)/g,
  uuids: /\{?(?:[0-9a-fA-F]-*){32}\}?/g,
  numeric_literals: /-?\b(?:[0-9]+\.)?[0-9]+([eE][+-]?[0-9]+)?\b/g,
  boolean_literals: /\b(?:true|false|null)\b/gi,
  hexadecimal_literals: /0x[0-9a-fA-F]+/g,
  comments: /(?:#|--).*?(?=\r|\n|$)/gi,
  multi_line_comments: /\/\*(?:[^/]|\/[^*])*?(?:\*\/|\/\*.*)/g,
  oracle_quoted_strings: /q'\[.*?(?:\]'|$)|q'\{.*?(?:\}'|$)|q'<.*?(?:>'|$)|q'\(.*?(?:\)'|$)/g,
};

// We use these to check whether the query contains any quote characters
// after obfuscation. If so, that's a good indication that the original
// query was malformed, and so our obfuscation can't reliably find
// literals. In such a case, we'll replace the entire query with a
// placeholder.
const CLEANUP_REGEXP: Record<string, RegExp> = {
  mysql: /'|"|\/\*|\*\//,
  mysql2: /'|"|\/\*|\*\//,
  postgres: /'|\/\*|\*\/|\$(?!\?)/,
  sqlite: /'|\/\*|\*\//,
  cassandra: /'|\/\*|\*\//,
  oracle: /'|\/\*|\*\//,
  oracle_enhanced: /'|\/\*|\*\//,
};

/**
 * @type {{string: string[]}}
 */
const DIALECT_COMPONENTS: Record<string, string[]> = {
  fallback: Object.keys(COMPONENTS_REGEXP_MAP),
  mysql: [
    'single_quotes',
    'double_quotes',
    'numeric_literals',
    'boolean_literals',
    'hexadecimal_literals',
    'comments',
    'multi_line_comments',
  ],
  postgres: [
    'single_quotes',
    'dollar_quotes',
    'uuids',
    'numeric_literals',
    'boolean_literals',
    'comments',
    'multi_line_comments',
  ],
  sqlite: [
    'single_quotes',
    'numeric_literals',
    'boolean_literals',
    'hexadecimal_literals',
    'comments',
    'multi_line_comments',
  ],
  oracle: [
    'single_quotes',
    'oracle_quoted_strings',
    'numeric_literals',
    'comments',
    'multi_line_comments',
  ],
  cassandra: [
    'single_quotes',
    'uuids',
    'numeric_literals',
    'boolean_literals',
    'hexadecimal_literals',
    'comments',
    'multi_line_comments',
  ],
};

const PLACEHOLDER = '?';

/**
 * @param {string} dialect
 * @returns {RegExp[]}
 */
function generateRegexp(dialect: string): RegExp[] {
  const components = DIALECT_COMPONENTS[dialect];
  // No Regexp.union in JS
  return components.map((component) => COMPONENTS_REGEXP_MAP[component]);
}

const MYSQL_COMPONENTS_REGEXP = generateRegexp('mysql');
const POSTGRES_COMPONENTS_REGEXP = generateRegexp('postgres');
const SQLITE_COMPONENTS_REGEXP = generateRegexp('sqlite');
const ORACLE_COMPONENTS_REGEXP = generateRegexp('oracle');
const CASSANDRA_COMPONENTS_REGEXP = generateRegexp('cassandra');
const FALLBACK_REGEXP = generateRegexp('fallback');

function detectUnmatchedPairs(obfuscated: string, adapter: string): boolean {
  if (CLEANUP_REGEXP[adapter]) {
    return CLEANUP_REGEXP[adapter].test(obfuscated);
  }
  return CLEANUP_REGEXP.mysql.test(obfuscated);
}

const FAILED_TO_OBFUSCATE_MESSAGE =
  'Failed to obfuscate SQL query - quote characters remained after obfuscation';

export interface SQLEvent {
  sql: string;
  event: Event;
}

export interface SQLCount {
  count: number;
  events: Event[];
}

/**
 * Replaces literal query parameters with parameter symbols (e.g. '?');
 *
 * @param {string} sql
 * @param {string} adapter
 * @returns {string}
 */
export function obfuscate(sql: string, adapter: string): string {
  /** @type {RegExp[]} */ let regexp;
  switch (adapter) {
    case 'mysql':
    case 'mysql2':
      regexp = MYSQL_COMPONENTS_REGEXP;
      break;
    case 'postgres':
      regexp = POSTGRES_COMPONENTS_REGEXP;
      break;
    case 'sqlite':
      regexp = SQLITE_COMPONENTS_REGEXP;
      break;
    case 'oracle':
    case 'oracle_enhanced':
      regexp = ORACLE_COMPONENTS_REGEXP;
      break;
    case 'cassandra':
      regexp = CASSANDRA_COMPONENTS_REGEXP;
      break;
    default:
      regexp = FALLBACK_REGEXP;
  }

  let obfuscated = sql;
  // eslint-disable-next-line no-return-assign
  regexp.forEach((re) => (obfuscated = obfuscated.replace(re, PLACEHOLDER)));
  if (detectUnmatchedPairs(obfuscated, adapter)) {
    obfuscated = FAILED_TO_OBFUSCATE_MESSAGE;
  }
  return obfuscated;
}

export function sqlNormalized(query: SqlQuery): string {
  return obfuscate(query.sql, query.database_type);
}

export function capitalizeString(str: string): string {
  if (typeof str !== 'string') {
    return '';
  }

  return str.slice(0, 1).toUpperCase() + str.slice(1).toLowerCase();
}

export function getHttpLabel(event: Event): string | undefined {
  if (!event.httpServerRequest) {
    return;
  }

  const requestMethod = event.httpServerRequest.request_method;
  const pathInfo = event.httpServerRequest.path_info;
  let label;

  try {
    // the url is fake, we only care about the path info anyway
    const url = new URL(pathInfo, 'http://hostname');
    label = `${requestMethod} ${url.pathname}`;
  } catch (ex) {
    label = 'HTTP Request';
  }

  return label;
}

const sqlLabels = new Set([
  'insert',
  'update',
  'select',
  'delete',
  'alter',
  'create',
  'drop',
  'rename',
  'truncate',
  'replace',
  'savepoint',
  'release',
  'rollback',
  'lock',
  'unlock',
  'set',
  'start',
  'call',
  'delete',
  'do',
  'perform',
  'handler',
  'load',
  'purge',
  'reset',
  'prepare',
  'execute',
  'deallocate',
  'xa',
]);

export function getSqlLabelFromString(sqlString: string): string {
  const sqlChars = [...sqlString.trimLeft()];
  if (sqlChars.length > 0 && sqlChars[0] === '(') {
    // if the query is wrapped in parenthesis, drop the opening parenthesis
    // it doesn't matter if we leave a hanging closing parenthesis.
    // e.g. (SELECT 1);

    sqlChars.shift();
  }

  // drop sub-queries and parenthesized expressions
  let depth = 0;
  const topLevelSql = sqlChars
    .reduce((arr, c) => {
      if (c === '(') {
        depth += 1;
      }

      if (depth === 0) {
        arr.push(c);
      }

      if (c === ')') {
        depth -= 1;
      }

      return arr;
    }, [] as string[])
    .join('');

  let queryType;
  if (topLevelSql.search(/\s/) === -1) {
    // There's only a single token
    // e.g. BEGIN, COMMIT, CHECKPOINT
    queryType = topLevelSql;
  } else {
    // convert non-word sequences to spaces and split by space
    // find the first known token
    queryType =
      topLevelSql
        .replace(/[^\w]+/g, ' ')
        .toLowerCase()
        .split(' ')
        .find((t) => sqlLabels.has(t)) || 'unknown';
  }

  return ['SQL', capitalizeString(queryType) || null].join(' ');
}

export function isSelect(sql: string): boolean {
  return getSqlLabelFromString(sql) === 'SQL Select';
}

export function* sqlStrings(
  event: Event,
  appMapIndex: AppMapIndex,
  filter: EventFilter = () => true
): Generator<SQLEvent> {
  for (const evt of appMapIndex.forType('sql_query', event)) {
    if (!evt.sqlQuery) {
      continue;
    }
    if (!filter(evt, appMapIndex)) {
      continue;
    }

    if (!isSelect(evt.sqlQuery!)) {
      continue;
    }

    if (!filter(evt, appMapIndex)) {
      continue;
    }

    const sql = appMapIndex.sqlNormalized(evt);

    yield { event: evt, sql };
  }
}

export function countJoins(ast: QueryAST | undefined): number {
  if (!ast) return 0;

  let joins = 0;
  visit(ast, {
    'map.join': (node) => {
      joins += node.map.length;
    },
  });

  return joins;
}

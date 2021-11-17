// License: https://github.com/newrelic/newrelic-ruby-agent/blob/main/LICENSE
// Apache License 2.0

import Event from './event';
import EventNavigator from './eventNavigator';
import { getSqlLabelFromString, normalizeSQL } from './util';

/**
 * @type {Record<string, RegExp>}
 */
const COMPONENTS_REGEXP_MAP = {
  single_quotes: /'(?:[^']|'')*?(?:\\'.*|'(?!'))/g,
  double_quotes: /"(?:[^"]|"")*?(?:\\".*|"(?!"))/g,
  dollar_quotes: /(\$(?!\d)[^$]*?\$).*?(?:\1|$)/g,
  uuids: /\{?(?:[0-9a-fA-F]-*){32}\}?/g,
  numeric_literals: /-?\b(?:[0-9]+\.)?[0-9]+([eE][+-]?[0-9]+)?\b/g,
  boolean_literals: /\b(?:true|false|null)\b/gi,
  hexadecimal_literals: /0x[0-9a-fA-F]+/g,
  comments: /(?:#|--).*?(?=\r|\n|$)/gi,
  multi_line_comments: /\/\*(?:[^/]|\/[^*])*?(?:\*\/|\/\*.*)/g,
  oracle_quoted_strings:
    /q'\[.*?(?:\]'|$)|q'\{.*?(?:\}'|$)|q'<.*?(?:>'|$)|q'\(.*?(?:\)'|$)/g,
};

// We use these to check whether the query contains any quote characters
// after obfuscation. If so, that's a good indication that the original
// query was malformed, and so our obfuscation can't reliably find
// literals. In such a case, we'll replace the entire query with a
// placeholder.
/**
 * @type {Record<string, RegExp>}
 */
const CLEANUP_REGEXP = {
  mysql: /'|"|\/\*|\*\//,
  mysql2: /'|"|\/\*|\*\//,
  postgres: /'|\/\*|\*\/|\$(?!\?)/,
  sqlite: /'|\/\*|\*\//,
  cassandra: /'|\/\*|\*\//,
  oracle: /'|\/\*|\*\//,
  oracle_enhanced: /'|\/\*|\*\//,
};

/**
 * @type {Record<string, RegExp>}
 */
const DIALECT_COMPONENTS = {
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
function generateRegexp(dialect) {
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

/**
 * @param {string} obfuscated
 * @param {string} adapter
 * @returns {boolean}
 */
function detectUnmatchedPairs(obfuscated, adapter) {
  if (CLEANUP_REGEXP[adapter]) {
    return CLEANUP_REGEXP[adapter].test(obfuscated);
  }
  return CLEANUP_REGEXP.mysql.test(obfuscated);
}

const FAILED_TO_OBFUSCATE_MESSAGE =
  'Failed to obfuscate SQL query - quote characters remained after obfuscation';

/**
 * Replaces literal query parameters with parameter symbols (e.g. '?');
 *
 * @param {string} sql
 * @param {string} adapter
 * @returns {string}
 */
export function obfuscate(sql, adapter) {
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

/**
 * @param {SqlQuery} query
 * @returns {string}
 */
export function sqlNormalized(query) {
  return obfuscate(query.sql, query.database_type);
}

/**
 * @param {string} sql
 * @returns {boolean}
 */
export function isSelect(sql) {
  return getSqlLabelFromString(sql) === 'SQL Select';
}

/**
 * @param {Event} normalizedSql
 * @param {string[]} whitelist
 * @returns {Generator<SQLEvent>}
 */
export function* sqlStrings(event, whitelist = []) {
  for (const e of new EventNavigator(event).descendants()) {
    if (!e.event.sqlQuery) {
      continue;
    }

    if (!isSelect(e.event.sqlQuery)) {
      continue;
    }

    const sql = sqlNormalized(e.event.sql);
    if (whitelist.includes(sql)) {
      continue;
    }

    yield { event: e.event, sql };
  }
}

/**
 * @param {string} normalizedSql
 * @returns {number}
 */
export function countJoins(normalizedSql) {
  try {
    const result = normalizeSQL(normalizedSql);
    return result.joinCount || 0;
  } catch (e) {
    console.warn(`Unable to analyze query "${normalizedSql}"`);
    return 0;
  }
}

// @ts-ignore
const { normalizeSQL } = require('@appland/models');

// https://github.com/newrelic/newrelic-ruby-agent/blob/dev/lib/new_relic/agent/database/obfuscation_helpers.rb
// License: https://github.com/newrelic/newrelic-ruby-agent/blob/main/LICENSE
// Apache License 2.0

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
 * @type {{string: string[]}}
 */
const DIALECT_COMPONENTS = {
  // @ts-ignore
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

function obfuscateSingleQuoteLiterals(sql) {
  if (!COMPONENTS_REGEXP_MAP.single_quotes.test(sql)) {
    return sql;
  }
  return sql.gsub(COMPONENTS_REGEXP_MAP.single_quotes, PLACEHOLDER);
}

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
function obfuscate(sql, adapter) {
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

const QUERY_CACHE = {};

function analyzeQuery(
  /** @type {import('./search/types').SQL | string} */ query
) {
  if (typeof query === 'string') {
    // This is a problem because we don't know what SQL dialect to apply.
    console.warn(`No database_type available for ${query}`);
    return normalizeSQL(query);
  }

  const { sql, database_type: databaseType } = query;

  if (sql && databaseType) {
    const obfuscatedSQL = obfuscate(sql, databaseType);

    const cachedResult = QUERY_CACHE[obfuscatedSQL];
    if (cachedResult) {
      return cachedResult;
    }

    const result = normalizeSQL(obfuscatedSQL);
    QUERY_CACHE[obfuscatedSQL] = result;
    return result;
  }

  console.warn(
    `sql or database_type not available for ${JSON.stringify(query)}`
  );
  return normalizeSQL(sql);
}

module.exports = { analyzeQuery, obfuscate, obfuscateSingleQuoteLiterals };

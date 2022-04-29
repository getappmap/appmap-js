import { EventNavigator, Event } from '@appland/models';
import { visit } from './visit';
import { AppMapIndex, EventFilter, QueryAST } from '../types';
import { URL } from 'url';

export interface SQLEvent {
  sql: string;
  event: Event;
}

export interface SQLCount {
  count: number;
  events: Event[];
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
  for (const e of new EventNavigator(event).descendants()) {
    if (!e.event.sql) {
      continue;
    }
    if (!filter(e.event, appMapIndex)) {
      continue;
    }

    if (!isSelect(e.event.sqlQuery!)) {
      continue;
    }

    if (!filter(event, appMapIndex)) {
      continue;
    }

    const sql = appMapIndex.sqlNormalized(e.event);

    yield { event: e.event, sql };
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

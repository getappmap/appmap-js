import { Event, EventNavigator } from '@appland/models';
import { isSelect } from '../database';
import { AssertionSpec } from '../types';
import Assertion from '../assertion';

function hasLimitClause(sql: string): boolean {
  return /\blimit\b/i.test(sql);
}

function isCount(sql: string): boolean {
  return /\bcount\b/i.test(sql);
}

function isMetadataQuery(sql: string): boolean {
  return /\bsqlite_master\b/.test(sql);
}

function isBatched(e: Event): boolean {
  return hasLimitClause(e.sqlQuery!) || isCount(e.sqlQuery!) || isMetadataQuery(e.sqlQuery!);
}

function isMaterialized(e: Event): boolean | undefined {
  for (const ancestor of new EventNavigator(e).ancestors()) {
    if (ancestor.event.codeObject.labels.has(DAOMaterialize)) {
      return true;
    }
  }
}

function scanner(): Assertion {
  return Assertion.assert(
    'unbatched-materialized-query',
    'Unbatched materialized SQL query',
    (e: Event) => isSelect(e.sqlQuery!) && !isBatched(e) && isMaterialized(e),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery;
      assertion.description = `Unbatched materialized SQL query`;
    }
  );
}

// Example: ActiveRecord::Relation#records
const DAOMaterialize = 'dao.materialize';

export default {
  Labels: [DAOMaterialize],
  scope: 'command',
  enumerateScope: true,
  scanner,
} as AssertionSpec;

import { parseSQL } from '@appland/models';
import type { SqliteParser } from 'sqlite-parser';
import type { Event } from '@appland/models';

import ScopeIterator from './scopeIterator';
import type { Scope } from 'src/types';

function isBegin(ast: SqliteParser.Statement): boolean {
  switch (ast.variant) {
    case 'list':
      return ast.statement.some((s) => isBegin(s));
    case 'transaction':
      return ast.action === 'begin';
    default:
      return false;
  }
}

type TransactionEndStatement = SqliteParser.TransactionStatement & {
  action: 'commit' | 'rollback';
};

function isEnd(ast: SqliteParser.Statement): TransactionEndStatement | undefined {
  switch (ast.variant) {
    case 'list':
      for (const statement of ast.statement) {
        const result = isEnd(statement);
        if (result) return result;
      }
      return undefined;
    case 'transaction':
      return ast.action === 'begin' ? undefined : (ast as TransactionEndStatement);
    default:
      return undefined;
  }
}

export interface TransactionDetails {
  transaction: {
    status: 'commit' | 'rollback';
    events: Event[];
  };
}

export function hasTransactionDetails(
  event: Event & Partial<TransactionDetails>
): event is Event & TransactionDetails {
  return event.transaction !== undefined;
}

function iterateTransaction(
  begin: Event & Partial<TransactionDetails>,
  tail: Iterator<Event>
): Scope {
  // since we can only go through the tail once,
  // we have to keep the list of events in the transaction
  const transaction: Event[] = [];
  for (let next = tail.next(); !next.done; next = tail.next()) {
    const event = next.value;
    if (!event.isCall()) continue;
    transaction.push(event);
    if (!event.sql) continue;
    // TODO: This should be routing through the AppMapIndex AST cache.
    const sql = parseSQL(event.sql.sql);
    if (!sql) continue;

    // This is normally a noop which generates a SQL warning.
    // It can also happen if there's more than one SQL connection used
    // and the new transaction is open in a different one than before.
    // We currently don't track the separate connections, so we have to
    // assume this is the same one and issue a warning.
    if (isBegin(sql))
      console.warn(`SQL transaction started within a transaction in event ${event.id}`);

    const end = isEnd(sql);
    if (end) {
      begin.transaction = { status: end.action, events: transaction };
      break;
    }
  }

  if (!begin.transaction) {
    // Transaction was still active at the end of appmap;
    // assume it was aborted.
    begin.transaction = { status: 'rollback', events: transaction };
  }

  return {
    scope: begin,
    events: transaction[Symbol.iterator] as () => Generator<Event>,
  };
}

export default class SQLTransactionScope extends ScopeIterator {
  *scopes(events: IterableIterator<Event>): Generator<Scope, void, void> {
    for (const event of events) {
      if (!event.isCall() || !event.sql) continue;
      const sql = parseSQL(event.sql.sql);
      if (sql && isBegin(sql) && !isEnd(sql)) {
        yield iterateTransaction(event, events);
      }
    }
  }
}

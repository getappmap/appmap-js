import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope, ScopedEvent } from '../types';
import { verbose } from '../scanner/util';

const sqlNormalized = (event: Event) => event.sqlQuery!.split(/\s/).join(' ').toLowerCase();

const beginSQLTransaction = (event: Event): boolean =>
  !!event.sqlQuery && sqlNormalized(event).includes('begin transaction');

const endSQLTransaction = (event: Event): boolean =>
  !!event.sqlQuery &&
  (/\bcommit\b/.test(sqlNormalized(event)) || /\brollback\b/.test(sqlNormalized(event)));

const beginTransaction = (event: Event): boolean => {
  return beginSQLTransaction(event) || (event.isCall() && !!event.httpServerRequest);
};

const endTransaction = (event: Event): boolean => {
  return endSQLTransaction(event) || (event.isReturn() && !!event.httpServerResponse);
};

export default class TransactionStrategy extends Strategy {
  protected scope: Scope = 'transaction';

  *selectEvents(events: Generator<Event>): Generator<ScopedEvent> {
    const transactionStack: Event[] = [];
    let eventResult = events.next();
    while (!eventResult.done) {
      const event = eventResult.value;

      if (beginTransaction(event)) {
        if (verbose()) {
          console.log(`Begin transaction ${event}`);
        }
        transactionStack.push(event);
      } else if (endTransaction(event)) {
        if (verbose()) {
          console.log(`End transaction ${event}`);
        }
        transactionStack.pop();
      }

      if (event.isCall() && transactionStack.length > 0) {
        const scopeId = transactionStack[transactionStack.length - 1].id.toString();
        yield { event, scopeId };
      }
      eventResult = events.next();
    }
  }
}

import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope, ScopedEvent } from '../types';

export default class TransactionStrategy extends Strategy {
  protected scope: Scope = 'transaction';

  *selectEvents(events: Generator<Event>): Generator<ScopedEvent> {
    const transactionStack: Event[] = [];
    let eventResult = events.next();
    while (!eventResult.done) {
      const event = eventResult.value;
      if (event.sqlQuery) {
        const sqlNormalized = event.sqlQuery.split(/\s/).join(' ').toLowerCase();
        if (sqlNormalized.includes('begin transaction')) {
          transactionStack.push(event);
        } else if (/\bcommit\b/.test(sqlNormalized) || /\brollback\b/.test(sqlNormalized)) {
          transactionStack.pop();
        }
      }

      if (transactionStack.length > 0) {
        yield { event, scopeId: transactionStack[0].id.toString() };
      }
      eventResult = events.next();
    }
  }
}

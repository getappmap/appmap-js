import { Event } from '@appland/models';
import { Scope } from '../types';
import SingleContextStrategy from './singleContextStrategy';

export default class SqlQueryStrategy extends SingleContextStrategy {
  protected scope: Scope = 'sql_query';

  protected isEventApplicable(event: Event): boolean {
    return event.sql !== undefined;
  }
}

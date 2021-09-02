import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class SqlQueryStrategy extends Strategy {
  protected scope: Scope = 'sql_query';

  protected isEventApplicable(event: Event): boolean {
    return event.sql !== undefined;
  }
}

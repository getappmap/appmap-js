import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class FunctionStrategy extends Strategy {
  protected scope: Scope = 'function';

  protected isEventApplicable(event: Event): boolean {
    return event.isFunction;
  }
}

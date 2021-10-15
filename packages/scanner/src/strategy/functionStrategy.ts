import { Event } from '@appland/models';
import { Scope } from '../types';
import SingleContextStrategy from './singleContextStrategy';

export default class FunctionStrategy extends SingleContextStrategy {
  protected scope: Scope = 'function';

  protected isEventApplicable(event: Event): boolean {
    return event.isFunction;
  }
}

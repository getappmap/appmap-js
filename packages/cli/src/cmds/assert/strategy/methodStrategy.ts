// @ts-ignore
import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class MethodStrategy extends Strategy {
  protected scope: Scope = 'method';

  protected isEventApplicable(event: Event): Boolean {
    return event.methodId;
  }
}

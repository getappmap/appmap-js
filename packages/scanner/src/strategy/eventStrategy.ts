// @ts-ignore
import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class EventStrategy extends Strategy {
  protected scope: Scope = 'event';

  protected isEventApplicable(event: Event): boolean {
    return true;
  }
}

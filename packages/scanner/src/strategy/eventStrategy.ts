import Strategy from './strategy';
import { Scope } from '../types';

export default class EventStrategy extends Strategy {
  protected scope: Scope = 'event';

  protected isEventApplicable(): boolean {
    return true;
  }
}

import { Scope } from '../types';
import SingleContextStrategy from './singleContextStrategy';

export default class EventStrategy extends SingleContextStrategy {
  protected scope: Scope = 'event';

  protected isEventApplicable(): boolean {
    return true;
  }
}

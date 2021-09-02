import Strategy from './strategy';
import { Scope } from '../types';

export default class AppMapStrategy extends Strategy {
  protected scope: Scope = 'appmap';

  protected isEventApplicable(): boolean {
    return true;
  }
}

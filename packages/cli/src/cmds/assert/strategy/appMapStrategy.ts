// @ts-ignore
import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class AppMapStrategy extends Strategy {
  protected scope: Scope = 'appmap';

  protected isEventApplicable(event: Event): boolean {
    return true;
  }
}

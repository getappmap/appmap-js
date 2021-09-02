import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class HttpRequestStrategy extends Strategy {
  protected scope: Scope = 'http_server_request';

  protected isEventApplicable(event: Event): boolean {
    return event.httpServerRequest !== undefined;
  }
}

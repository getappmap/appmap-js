import { Event } from '@appland/models';
import Strategy from './strategy';
import { Scope } from '../types';

export default class HttpClientRequestStrategy extends Strategy {
  protected scope: Scope = 'http_client_request';

  protected isEventApplicable(event: Event): boolean {
    return event.httpClientRequest !== undefined;
  }
}

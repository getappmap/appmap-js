import { Event } from '@appland/models';
import { Scope } from '../types';
import SingleContextStrategy from './singleContextStrategy';

export default class HttpClientRequestStrategy extends SingleContextStrategy {
  protected scope: Scope = 'http_client_request';

  protected isEventApplicable(event: Event): boolean {
    return event.httpClientRequest !== undefined;
  }
}

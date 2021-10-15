import { Event } from '@appland/models';
import { Scope } from '../types';
import SingleContextStrategy from './singleContextStrategy';

export default class HttpServerRequestStrategy extends SingleContextStrategy {
  protected scope: Scope = 'http_server_request';

  protected isEventApplicable(event: Event): boolean {
    return event.httpServerRequest !== undefined;
  }
}

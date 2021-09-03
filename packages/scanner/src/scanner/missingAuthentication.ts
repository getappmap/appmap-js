// @ts-ignore
import { Event, EventNavigator } from '@appland/models';
import Assertion from '../assertion';
import { contentType, isFalsey } from './util';

function isPublic(event: Event): boolean {
  return event.labels.has('public');
}

function providesAuthentication(event: Event) {
  return (
    event.labels.has('security.authentication') && !isFalsey(event.returnValue)
  );
}

export default function (
  routes: RegExp[] = [/.*/],
  contentTypes: RegExp[] = [/.*/]
) {
  return Assertion.assert(
    'http_server_request',
    (event: Event) =>
      new EventNavigator(event)
        .descendants((e: Event) => isPublic(e) || providesAuthentication(e))
        .next()?.value,
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => {
        return (
          e.route !== undefined &&
          e.httpServerResponse !== undefined &&
          e.httpServerResponse!.status_code < 300 &&
          contentType(e) !== undefined &&
          routes.some((pattern) => pattern.test(e.route!)) &&
          contentTypes.some((pattern) => pattern.test(contentType(e)!))
        );
      };
      assertion.description = `HTTP server request must be authenticated`;
    }
  );
}

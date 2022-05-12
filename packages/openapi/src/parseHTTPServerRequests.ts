import { buildAppMap, Event } from '@appland/models';
import { rpcRequestForEvent } from './rpcRequest';

export default function parseHTTPServerRequests(
  source: any,
  collector: (event: Event) => void
) {
  const appmap = buildAppMap().source(source).normalize().build();

  appmap.events
    .filter((e) => e.httpServerRequest && e.httpServerResponse)
    .forEach(collector);
}

import { buildAppMap, Event } from '@appland/models';

export default function parseHTTPServerRequests(
  source: string | Record<string, unknown>,
  collector: (event: Event) => void
) {
  const appmap = buildAppMap().source(source).normalize().build();

  appmap.events.filter((e) => e.httpServerRequest && e.httpServerResponse).forEach(collector);
}

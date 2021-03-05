import betaV1Error from './canonicalize/beta_v1_error';
import betaV1Info from './canonicalize/beta_v1_info';
import betaV1Debug from './canonicalize/beta_v1_debug';

export const algorithms = {
  beta_v1_error: betaV1Error,
  beta_v1_info: betaV1Info,
  beta_v1_debug: betaV1Debug,
};

function httpServerRequestsOnly(appmap) {
  const httpServerRequestStack = [];
  const selectedEvents = [];
  appmap.events.forEach((event) => {
    if (event.isCall() && event.httpServerRequest) {
      httpServerRequestStack.push(event.httpServerRequest);
    }

    if (httpServerRequestStack.length > 0) {
      selectedEvents.push(event);
    }

    if (event.isReturn() && event.httpServerResponse) {
      httpServerRequestStack.pop();
    }
  });

  if (selectedEvents.length === 0) {
    console.warn(
      `No http server requests found in appmap ${appmap.data?.metadata?.name}`
    );
    return appmap;
  }

  const httpOnly = appmap.shallowCopy();
  httpOnly.data.events = selectedEvents;
  return httpOnly;
}

/**
 * Process an appmap into a canonical form which can be fingerprinted
 * by converting it to a byte sequence such as YAML or JSON.
 *
 * To canonicalize an appmap, the events are processed in order and transformed
 * according a defined set of rules. Some events are compacted and others are ignored.
 * Highly transient values such as object ids and thread ids are always discarded.
 */
export function canonicalize(algorithmName, appmap) {
  const algorithm = algorithms[algorithmName];
  if (!algorithm) {
    throw new Error(`Invalid canonicalization algorithm: ${algorithmName}`);
  }

  // TODO: In the Trace view, when an event list contains HTTP server requests there is
  // special treatment. The displayed tree roots are the HTTP server requests, and other
  // events that lie outside those requests (such as test fixture activity) are not shown
  // at all. If we want to treat the appmap that way for canonicalization purposes, this
  // is the place to do it.
  return algorithm(httpServerRequestsOnly(appmap));
}

/* eslint-disable global-require */
const algorithms = {
  update_v1: require('./canonicalize/update_v1'),
  info_v1: require('./canonicalize/info_v1'),
  trace_v1: require('./canonicalize/trace_v1'),
};
/* eslint-enable global-require */

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
    // console.warn('No http server requests found in appmap');
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
function canonicalize(algorithmName, appmap) {
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

module.exports = {
  algorithms,
  canonicalize,
};

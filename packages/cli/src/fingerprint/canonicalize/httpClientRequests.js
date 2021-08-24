/* eslint-disable class-methods-use-this */
const Unique = require('./unique');

class Canonicalize extends Unique {
  httpClientRequest(event) {
    const status = event.httpClientResponse
      ? event.httpClientResponse.status_code
      : null;
    const parameterNames = event.message
      ? event.message.map((m) => m.name)
      : [];

    return { route: event.route, parameters: parameterNames.sort(), status };
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();

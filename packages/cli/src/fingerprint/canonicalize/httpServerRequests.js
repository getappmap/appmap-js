/* eslint-disable class-methods-use-this */
const Unique = require('./unique');

class Canonicalize extends Unique {
  httpServerRequest(event) {
    const status = event.httpServerResponse
      ? event.httpServerResponse.status || event.httpServerResponse.status_code
      : null;
    const parameterNames = event.message
      ? event.message.map((m) => m.name)
      : [];
    const parameters = `(${parameterNames.join(',')})`;

    return [event.route, parameters, status].filter((e) => e).join(' ');
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();

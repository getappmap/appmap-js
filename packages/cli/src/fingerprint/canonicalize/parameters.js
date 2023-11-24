/* eslint-disable class-methods-use-this */
const Unique = require('./unique');
const { collectParameters } = require('../../fulltext/collectParameters');

class Canonicalize extends Unique {
  functionCall(event) {
    return collectParameters(event);
  }

  httpServerRequest(event) {
    return collectParameters(event);
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();

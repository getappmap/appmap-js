/* eslint-disable class-methods-use-this */
const Unique = require('./unique');

class Canonicalize extends Unique {
  functionCall(event) {
    return [...event.codeObject.labels];
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();

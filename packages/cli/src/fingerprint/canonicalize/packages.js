/* eslint-disable class-methods-use-this */
const Unique = require('./unique');

class Canonicalize extends Unique {
  functionCall(event) {
    if (event.isFunction && event.codeObject.packageObject) {
      return event.codeObject.packageObject.id;
    }

    return null;
  }
}

module.exports = (appmap) => new Canonicalize(appmap).execute();

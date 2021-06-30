/* eslint-disable class-methods-use-this */
const { CodeObject } = require('@appland/models');
const Unique = require('./unique');

function classOf(codeObject) {
  if (!codeObject) {
    return null;
  }

  const ancestors = [codeObject, ...codeObject.ancestors()];
  let classObject = ancestors.find((a) => a.type === CodeObject.CLASS);
  if (!classObject && ancestors.length >= 2) {
    classObject = ancestors[ancestors.length - 2];
  }
  return classObject;
}

class Canonicalize extends Unique {
  functionCall(event) {
    if (event.parent) {
      const myClass = classOf(event.codeObject);
      const parentClass = classOf(event.parent.codeObject);
      if (myClass && parentClass && myClass.id !== parentClass.id) {
        return { caller: parentClass.id, callee: myClass.id };
      }
    }

    return null;
  }
}

Canonicalize.prototype.sql = Canonicalize.prototype.functionCall;
Canonicalize.prototype.httpServerRequest = Canonicalize.prototype.functionCall;
Canonicalize.prototype.httpClientRequest = Canonicalize.prototype.functionCall;

module.exports = (appmap) => new Canonicalize(appmap).execute();

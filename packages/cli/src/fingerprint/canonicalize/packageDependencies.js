/* eslint-disable class-methods-use-this */
const { CodeObject } = require('@appland/models');
const Unique = require('./unique');

function packageOf(codeObject) {
  if (!codeObject) {
    return null;
  }

  const ancestors = [codeObject, ...codeObject.ancestors()];
  let packageObject = ancestors.find((a) => a.type === CodeObject.PACKAGE);
  if (!packageObject && ancestors.length >= 1) {
    packageObject = ancestors[ancestors.length - 1];
  }
  return packageObject;
}

class Canonicalize extends Unique {
  functionCall(event) {
    if (event.parent) {
      const myPackage = packageOf(event.codeObject);
      const parentPackage = packageOf(event.parent.codeObject);
      if (myPackage && parentPackage && myPackage.id !== parentPackage.id) {
        return { caller: parentPackage.id, callee: myPackage.id };
      }
    }

    return null;
  }
}

Canonicalize.prototype.sql = Canonicalize.prototype.functionCall;
Canonicalize.prototype.httpServerRequest = Canonicalize.prototype.functionCall;
Canonicalize.prototype.httpClientRequest = Canonicalize.prototype.functionCall;

module.exports = (appmap) => new Canonicalize(appmap).execute();

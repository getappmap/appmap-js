// @ts-check

const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');
const { verbose } = require('../utils');

class FunctionMatcher {
  /**
   * Search code objects in the classMap, looking for matches to a spec.
   *
   * @param {import('./types').FunctionSpec} functionSpec
   */
  constructor(functionSpec) {
    this.functionSpec = functionSpec;
    this.depth = 0;
  }

  /**
   * @param {import('./types').CodeObject} codeObject
   * @returns {string}
   */
  match(codeObject) {
    const codeObjectStr = JSON.stringify({
      name: codeObject.name,
      static: codeObject.static,
      type: codeObject.type,
    });
    if (this.depth < 0) {
      console.warn(`Search depth ${this.depth} is less than zero; aborting`);
      return MATCH_ABORT;
    }
    if (this.depth >= this.functionSpec.tokens.length) {
      console.warn(
        `Aborting match ${codeObjectStr} because the search depth ${this.depth} exceeds the spec length ${this.functionSpec.tokens.length}`
      );
      return MATCH_ABORT;
    }
    const token = this.functionSpec.tokens[this.depth];
    if (!token(codeObject)) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${
            this.depth
          } does not match ${codeObjectStr}`
        );
      }
      return MATCH_ABORT;
    }
    if (this.depth === this.functionSpec.tokens.length - 1) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${
            this.depth
          } matches ${codeObjectStr} and completes the search`
        );
      }
      return MATCH_COMPLETE;
    }
    if (verbose()) {
      console.warn(
        `${JSON.stringify(token)} at depth ${
          this.depth
        } matches ${codeObjectStr} and the search continues`
      );
    }
    this.depth += 1;
    return MATCH_CONTINUE;
  }

  pop() {
    this.depth -= 1;
  }
}

module.exports = FunctionMatcher;

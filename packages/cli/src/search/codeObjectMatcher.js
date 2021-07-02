// @ts-check

const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');
const { verbose } = require('../utils');

class CodeObjectMatcher {
  /**
   * Search code objects in the classMap, looking for matches to a spec.
   *
   * @param {import('./types').CodeObjectMatchSpec} matchSpec
   */
  constructor(matchSpec) {
    this.matchSpec = matchSpec;
    this.depth = 0;
  }

  /**
   * This method is called in a depth-first traversal of the class map. It
   * determines if the current code object in the traversal matches the spec.
   *
   * @param {import('./types').CodeObject} codeObject
   * @returns {string} MATCH_COMPLETE, MATCH_ABORT, or MATCH_COMPLETE
   */
  match(codeObject) {
    if (this.depth < 0) {
      console.warn(`Search depth ${this.depth} is less than zero; aborting`);
      return MATCH_ABORT;
    }
    if (this.depth >= this.matchSpec.tokens.length) {
      console.warn(
        `Aborting match ${codeObject.name} because the search depth ${this.depth} exceeds the spec length ${this.matchSpec.tokens.length}`
      );
      return MATCH_ABORT;
    }
    const token = this.matchSpec.tokens[this.depth];
    if (!token(codeObject)) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${this.depth} does not match '${
            codeObject.name
          }'`
        );
      }
      return MATCH_ABORT;
    }
    if (this.depth === this.matchSpec.tokens.length - 1) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${this.depth} matches '${
            codeObject.name
          }' and completes the search`
        );
      }
      this.depth += 1;
      return MATCH_COMPLETE;
    }
    if (verbose()) {
      console.warn(
        `${JSON.stringify(token)} at depth ${this.depth} matches '${
          codeObject.name
        }' and the search continues`
      );
    }
    this.depth += 1;
    return MATCH_CONTINUE;
  }

  pop() {
    this.depth -= 1;
  }
}

module.exports = CodeObjectMatcher;

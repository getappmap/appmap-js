import { verbose } from '../utils';
import { CodeObject, CodeObjectMatcher, CodeObjectMatchSpec } from './types';

const { MATCH_ABORT, MATCH_CONTINUE, MATCH_COMPLETE } = require('./constants');

class Matcher {
  depth = 0;

  constructor(public matchSpec: CodeObjectMatchSpec, public classMap: CodeObject[]) {}

  matchClassMap(): CodeObject[] {
    const findMatchingCodeObject = (item: CodeObject, matches: CodeObject[]): void => {
      const matchResult = this.matchCodeObject(item);
      switch (matchResult) {
        case MATCH_ABORT:
          return;
        case MATCH_COMPLETE:
          matches.push(item);
          return;
        case MATCH_CONTINUE:
        default:
      }
      if (item.children) {
        item.children.forEach((child) => {
          child.parent = item;
          findMatchingCodeObject(child, matches);
        });
      }
      this.popCodeObject();
    };

    let matches: CodeObject[] = [];
    for (const item of this.classMap) {
      findMatchingCodeObject(item, matches);
    }
    return matches;
  }

  /**
   * This method is called in a depth-first traversal of the class map. It
   * determines if the current code object in the traversal matches the spec.
   *
   * @returns {string} MATCH_COMPLETE, MATCH_ABORT, or MATCH_COMPLETE
   */
  matchCodeObject(codeObject: CodeObject): string {
    if (this.depth < 0) {
      console.warn(`Search depth ${this.depth} is less than zero; aborting`);
      return MATCH_ABORT;
    }
    if (this.depth >= this.matchSpec.tokens.length) {
      if (verbose()) {
        console.warn(
          `Aborting match ${codeObject.name} because the search depth ${this.depth} exceeds the spec length ${this.matchSpec.tokens.length}`
        );
      }
      return MATCH_ABORT;
    }
    const token = this.matchSpec.tokens[this.depth];
    if (!token(codeObject)) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${this.depth} does not match '${codeObject.name}'`
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

  popCodeObject() {
    this.depth -= 1;
  }
}

export default class DescentCodeObjectMatcher implements CodeObjectMatcher {
  matchSpec: CodeObjectMatchSpec;

  /**
   * Search code objects in the classMap, looking for matches to a spec.
   */
  constructor(matchSpec: CodeObjectMatchSpec) {
    this.matchSpec = matchSpec;
  }

  matchClassMap(classMap: CodeObject[]): CodeObject[] {
    return new Matcher(this.matchSpec, classMap).matchClassMap();
  }
}

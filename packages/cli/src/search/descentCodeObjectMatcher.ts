import { verbose } from '../utils';
import { IndexCodeObject, CodeObjectMatcher, CodeObjectMatchSpec } from './types';

import { MatchStatus } from './matchStatus';

class Matcher {
  depth = 0;

  constructor(public matchSpec: CodeObjectMatchSpec, public classMap: IndexCodeObject[]) {}

  matchClassMap(): IndexCodeObject[] {
    const findMatchingCodeObject = (item: IndexCodeObject, matches: IndexCodeObject[]): void => {
      const matchResult = this.matchCodeObject(item);
      switch (matchResult) {
        case MatchStatus.Abort:
          return;
        case MatchStatus.Complete:
          matches.push(item);
          return;
        case MatchStatus.Continue:
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

    let matches: IndexCodeObject[] = [];
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
  matchCodeObject(codeObject: IndexCodeObject): string {
    if (this.depth < 0) {
      console.warn(`Search depth ${this.depth} is less than zero; aborting`);
      return MatchStatus.Abort;
    }
    if (this.depth >= this.matchSpec.tokens.length) {
      if (verbose()) {
        console.warn(
          `Aborting match ${codeObject.name} because the search depth ${this.depth} exceeds the spec length ${this.matchSpec.tokens.length}`
        );
      }
      return MatchStatus.Abort;
    }
    const token = this.matchSpec.tokens[this.depth];
    if (!token(codeObject)) {
      if (verbose()) {
        console.warn(
          `${JSON.stringify(token)} at depth ${this.depth} does not match '${codeObject.name}'`
        );
      }
      return MatchStatus.Abort;
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
      return MatchStatus.Complete;
    }
    if (verbose()) {
      console.warn(
        `${JSON.stringify(token)} at depth ${this.depth} matches '${
          codeObject.name
        }' and the search continues`
      );
    }
    this.depth += 1;
    return MatchStatus.Continue;
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

  matchClassMap(classMap: IndexCodeObject[]): IndexCodeObject[] {
    return new Matcher(this.matchSpec, classMap).matchClassMap();
  }
}

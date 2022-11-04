import { verbose } from '../utils';
import { IndexCodeObject, CodeObjectMatcher } from './types';

export default class IterateCodeObjectMatcher implements CodeObjectMatcher {
  /**
   * Search code objects in the classMap, looking for matches to a spec.
   */
  constructor(public type: string, public pattern: RegExp) {}

  matchClassMap(classMap: IndexCodeObject[]): IndexCodeObject[] {
    const findMatchingCodeObject = (item: IndexCodeObject, matches: IndexCodeObject[]): void => {
      if (verbose()) console.log(`${this.type} ${item.fqid}`);
      if (item.type === this.type) {
        const id = item.fqid.slice(item.fqid.indexOf(':') + 1);
        if (this.pattern.test(id)) {
          if (verbose()) console.log(`${this.pattern} matches ${item.fqid}`);
          matches.push(item);
        }
      }

      if (item.children) {
        item.children.forEach((child) => {
          child.parent = item;
          findMatchingCodeObject(child, matches);
        });
      }
    };

    let matches: IndexCodeObject[] = [];
    for (const item of classMap) {
      findMatchingCodeObject(item, matches);
    }
    return matches;
  }
}

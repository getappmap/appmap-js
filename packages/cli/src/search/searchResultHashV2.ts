import { Event } from '@appland/models';
import { createHash, Hash } from 'crypto';

function hashEvent(entries: string[], prefix: string, event: Event): void {
  Object.keys(event.stableProperties)
    .sort()
    .forEach((key) =>
      entries.push(
        [[prefix, key].join('.'), event.stableProperties[key].toString()].join(
          '='
        )
      )
    );
}

/**
 * Builds a hash (digest) of a search result. The digest is constructed by first building a canonical
 * string of the search result, of the form:
 *
 * ```
 * [
 *   algorithmVersion=2
 *   stack[1].<property1>=value1
 *   ...
 *   stack[1].<propertyN>=valueN
 *   ...
 *   stack[3].<property1>=value1
 *   ...
 *   stack[3].<propertyN>=valueN
 * ]
 * ```
 */
export default class SearchResultHashV2 {
  private hashEntries: string[] = [];
  private hash: Hash;

  constructor(stack: Event[]) {
    this.hash = createHash('sha256');

    // Algorithm version is 2 because it closely matches the Findings hash algorithm v2
    const hashEntries = [['algorithmVersion', '2']].map((e) => e.join('='));
    this.hashEntries = hashEntries;

    stack.forEach((event, index) =>
      hashEvent(hashEntries, `stack[${index + 1}]`, event)
    );

    hashEntries.forEach((e) => this.hash.update(e));
  }

  get canonicalString(): string {
    return this.hashEntries.join('\n');
  }

  digest(): string {
    return this.hash.digest('hex');
  }
}

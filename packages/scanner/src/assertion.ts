import { AppMap, Event } from '@appland/models';
import { verbose } from './scanner/util';
import { EventFilter, Matcher } from './types';

export default class Assertion {
  public where?: EventFilter;
  public includeScope: EventFilter[];
  public excludeScope: EventFilter[];
  public includeEvent: EventFilter[];
  public excludeEvent: EventFilter[];
  public description?: string;
  public options?: any;

  static assert(
    id: string,
    summaryTitle: string,
    matcher: Matcher,
    cb?: (assertion: Assertion) => void
  ): Assertion {
    const assertion = new Assertion(id, summaryTitle, matcher);
    if (cb) {
      cb(assertion);
    }
    return assertion;
  }

  constructor(public id: string, public summaryTitle: string, public matcher: Matcher) {
    this.includeScope = [];
    this.excludeScope = [];
    this.includeEvent = [];
    this.excludeEvent = [];
  }

  filterScope(event: Event, appMap?: AppMap): boolean {
    if (this.includeScope.length > 0 && !this.includeScope.every((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'includeScope' clause is not satisifed.`);
      }
      return false;
    }
    if (this.excludeScope.some((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'excludeScope' clause is not satisifed.`);
      }
      return false;
    }
    return true;
  }

  filterEvent(event: Event, appMap?: AppMap): boolean {
    if (this.where && !this.where(event, appMap)) {
      if (verbose()) {
        console.warn(`\t'where' clause is not satisifed.`);
      }
      return false;
    }

    if (this.includeEvent.length > 0 && !this.includeEvent.every((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'includeEvent' clause is not satisifed.`);
      }
      return false;
    }
    if (this.excludeEvent.some((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'excludeEvent' clause is not satisifed.`);
      }
      return false;
    }
    return true;
  }

  toString(): string {
    const tokens = [`[${this.id}]`];
    if (this.description) {
      tokens.push(this.description);
    } else {
      tokens.push(this.matcher.toString());
    }
    if (this.where) {
      tokens.push(`(where ${this.where})`);
    }
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self: any = this;
    ['includeScope', 'excludeScope', 'includeEvent', 'excludeEvent'].forEach((key) => {
      if (self[key].length > 0) {
        tokens.push(`(${key} ${self[key].join(' && ')})`);
      }
    });
    return tokens.join(' ');
  }
}

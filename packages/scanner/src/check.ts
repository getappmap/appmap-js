import { AppMap, Event } from '@appland/models';
import { verbose } from './rules/util';
import { EventFilter, RuleLogic, Rule, ScopeName } from './types';

export default class Check {
  public scope: ScopeName;
  public includeScope: EventFilter[];
  public excludeScope: EventFilter[];
  public includeEvent: EventFilter[];
  public excludeEvent: EventFilter[];

  constructor(public rule: Rule, public options: Record<string, any>) {
    this.scope = rule.scope || 'root';
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

  toString(): string {
    const tokens = [`[${this.rule.id}]`];
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

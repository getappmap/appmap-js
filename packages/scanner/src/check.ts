import { Event } from '@appland/models';
import { verbose } from './rules/lib/util';
import { AppMapIndex, EventFilter, ImpactDomain, ImpactSubdomain, Rule, ScopeName } from './types';

export default class Check {
  public id: string;
  public impactDomain: ImpactDomain;
  public impactSubdomains: ImpactSubdomain[];
  public options: Record<string, unknown>;
  public scope: ScopeName;
  public includeScope: EventFilter[];
  public excludeScope: EventFilter[];
  public includeEvent: EventFilter[];
  public excludeEvent: EventFilter[];

  constructor(public rule: Rule, options?: Record<string, unknown>) {
    function makeOptions() {
      return rule.Options ? new rule.Options() : {};
    }

    this.id = rule.id;
    this.options = options || makeOptions();
    this.scope = rule.scope || 'command';
    this.includeScope = [];
    this.excludeScope = [];
    this.includeEvent = [];
    this.excludeEvent = [];
    this.impactDomain = rule.impactDomain;
    this.impactSubdomains = rule.impactSubdomains;
  }

  filterScope(event: Event, appMapIndex: AppMapIndex): boolean {
    if (this.includeScope.length > 0 && !this.includeScope.every((fn) => fn(event, appMapIndex))) {
      if (verbose()) {
        console.warn(`\t'includeScope' clause is not satisifed.`);
      }
      return false;
    }
    if (this.excludeScope.some((fn) => fn(event, appMapIndex))) {
      if (verbose()) {
        console.warn(`\t'excludeScope' clause is not satisifed.`);
      }
      return false;
    }
    return true;
  }

  toString(): string {
    const tokens = [`[${this.rule.id}]`];
    for (const key of ['includeScope', 'excludeScope', 'includeEvent', 'excludeEvent'] as const) {
      if (this[key].length > 0) {
        tokens.push(`(${key} ${this[key].join(' && ')})`);
      }
    }
    return tokens.join(' ');
  }
}

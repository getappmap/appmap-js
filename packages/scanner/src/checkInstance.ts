import { AppMap, Event } from '@appland/models';
import Check from './check';
import { verbose } from './rules/lib/util';
import { RuleLogic, ScopeName } from './types';

export default class CheckInstance {
  check: Check;
  ruleLogic: RuleLogic;

  constructor(check: Check) {
    this.check = check;
    this.ruleLogic = check.rule.build(check.options || {});
  }

  get checkId(): string {
    return this.check.id;
  }

  get ruleId(): string {
    return this.check.rule.id;
  }

  get title(): string {
    return this.check.rule.title;
  }

  get scope(): ScopeName {
    return this.check.scope;
  }

  get enumerateScope(): boolean {
    return this.check.rule.enumerateScope;
  }

  filterEvent(event: Event, appMap?: AppMap): boolean {
    if (this.ruleLogic.where && !this.ruleLogic.where(event, appMap)) {
      if (verbose()) {
        console.warn(`\t'where' clause is not satisifed.`);
      }
      return false;
    }

    if (
      this.check.includeEvent.length > 0 &&
      !this.check.includeEvent.every((fn) => fn(event, appMap))
    ) {
      if (verbose()) {
        console.warn(`\t'includeEvent' clause is not satisifed.`);
      }
      return false;
    }
    if (this.check.excludeEvent.some((fn) => fn(event, appMap))) {
      if (verbose()) {
        console.warn(`\t'excludeEvent' clause is not satisifed.`);
      }
      return false;
    }
    return true;
  }
}

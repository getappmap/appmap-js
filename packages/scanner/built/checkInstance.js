"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./rules/lib/util");
class CheckInstance {
    constructor(check) {
        this.check = check;
        this.ruleLogic = check.rule.build(check.options || {});
    }
    get checkImpactDomain() {
        return this.check.impactDomain;
    }
    get checkId() {
        return this.check.id;
    }
    get ruleId() {
        return this.check.rule.id;
    }
    get title() {
        return this.check.rule.title;
    }
    get scope() {
        return this.check.scope;
    }
    get enumerateScope() {
        return this.check.rule.enumerateScope;
    }
    filterEvent(event, appMapIndex) {
        if (this.ruleLogic.where && !this.ruleLogic.where(event, appMapIndex)) {
            if ((0, util_1.verbose)()) {
                console.warn(`\t'where' clause is not satisifed.`);
            }
            return false;
        }
        if (this.check.includeEvent.length > 0 &&
            !this.check.includeEvent.every((fn) => fn(event, appMapIndex))) {
            if ((0, util_1.verbose)()) {
                console.warn(`\t'includeEvent' clause is not satisifed.`);
            }
            return false;
        }
        if (this.check.excludeEvent.some((fn) => fn(event, appMapIndex))) {
            if ((0, util_1.verbose)()) {
                console.warn(`\t'excludeEvent' clause is not satisifed.`);
            }
            return false;
        }
        return true;
    }
}
exports.default = CheckInstance;

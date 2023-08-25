"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const util_1 = require("./rules/lib/util");
class Check {
    constructor(rule, options) {
        this.rule = rule;
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
        //TODO: Create Default value for impact domain
        this.impactDomain = rule.impactDomain;
    }
    filterScope(event, appMapIndex) {
        if (this.includeScope.length > 0 && !this.includeScope.every((fn) => fn(event, appMapIndex))) {
            if ((0, util_1.verbose)()) {
                console.warn(`\t'includeScope' clause is not satisifed.`);
            }
            return false;
        }
        if (this.excludeScope.some((fn) => fn(event, appMapIndex))) {
            if ((0, util_1.verbose)()) {
                console.warn(`\t'excludeScope' clause is not satisifed.`);
            }
            return false;
        }
        return true;
    }
    toString() {
        const tokens = [`[${this.rule.id}]`];
        for (const key of ['includeScope', 'excludeScope', 'includeEvent', 'excludeEvent']) {
            if (this[key].length > 0) {
                tokens.push(`(${key} ${this[key].join(' && ')})`);
            }
        }
        return tokens.join(' ');
    }
}
exports.default = Check;

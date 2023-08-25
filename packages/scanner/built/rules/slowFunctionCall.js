"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchPattern_1 = require("./lib/matchPattern");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.functions = [];
        this.timeAllowed = 0.1;
    }
}
function build(options) {
    const functionPatterns = (0, matchPattern_1.buildFilters)(options.functions || []);
    return {
        matcher: (e) => {
            if (e.returnEvent.elapsedTime > options.timeAllowed) {
                return `Slow ${e.codeObject.id} call (${e.returnEvent.elapsedTime}ms)`;
            }
        },
        where: (e) => e.isFunction &&
            !!e.returnEvent &&
            !!e.returnEvent.elapsedTime &&
            !!e.codeObject.id &&
            (functionPatterns.length === 0 ||
                functionPatterns.some((pattern) => pattern(e.codeObject.id))),
    };
}
const RULE = {
    id: 'slow-function-call',
    title: 'Slow function call',
    impactDomain: 'Performance',
    enumerateScope: true,
    description: (0, parseRuleDescription_1.default)('slowFunctionCall'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#slow-function-call',
    Options,
    build,
};
exports.default = RULE;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.timeAllowed = 1;
    }
}
function build(options = new Options()) {
    return {
        matcher: (e) => e.elapsedTime > options.timeAllowed,
        where: (e) => !!e.sqlQuery && !!e.elapsedTime,
    };
}
const RULE = {
    id: 'slow-query',
    title: 'Slow SQL query',
    Options,
    impactDomain: 'Performance',
    enumerateScope: true,
    description: (0, parseRuleDescription_1.default)('slowQuery'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#slow-query',
    build,
};
exports.default = RULE;

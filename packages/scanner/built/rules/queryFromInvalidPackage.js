"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const matchPattern_1 = require("./lib/matchPattern");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
// TODO: Use the Query AST for this.
const WHITELIST = [/\bBEGIN\b/i, /\bCOMMIT\b/i, /\bROLLBACK\b/i, /\bRELEASE\b/i, /\bSAVEPOINT\b/i];
class Options {
    constructor() {
        this.allowedPackages = [];
        this.allowedQueries = WHITELIST.map((regexp) => ({ match: regexp }));
    }
}
function build(options) {
    const allowedPackages = (0, matchPattern_1.buildFilters)(options.allowedPackages);
    const allowedQueries = (0, matchPattern_1.buildFilters)(options.allowedQueries);
    function matcher(e) {
        if (!e.parent)
            return;
        const parent = e.parent;
        if (!allowedPackages.some((filter) => filter(parent.codeObject.packageOf))) {
            return [
                {
                    event: e,
                    message: `${e.codeObject.id} is invoked from illegal package ${parent.codeObject.packageOf}`,
                    participatingEvents: { parent: parent },
                },
            ];
        }
    }
    function where(e) {
        return !!e.sqlQuery && !!e.parent && !allowedQueries.some((pattern) => pattern(e.sqlQuery));
    }
    return {
        matcher,
        where,
    };
}
const RULE = {
    id: 'query-from-invalid-package',
    title: 'Queries from invalid packages',
    Options,
    impactDomain: 'Maintainability',
    enumerateScope: true,
    references: {
        'CWE-1057': new url_1.URL('https://cwe.mitre.org/data/definitions/1057.html'),
    },
    description: (0, parseRuleDescription_1.default)('queryFromInvalidPackage'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#query-from-invalid-package',
    build,
};
exports.default = RULE;

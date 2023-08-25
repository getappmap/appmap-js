"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
class Options {
    constructor() {
        this.forbiddenLabel = 'mvc.template';
    }
}
function build(options = new Options()) {
    function matcher(e) {
        const forbiddenAncestor = e
            .ancestors()
            .find((e) => e.codeObject.labels.has(options.forbiddenLabel));
        if (forbiddenAncestor) {
            return [
                {
                    event: e,
                    message: `SQL query is invoked from invalid event ${forbiddenAncestor}, labeled ${options.forbiddenLabel}`,
                    relatedEvents: [forbiddenAncestor],
                },
            ];
        }
    }
    function where(e) {
        return !!e.sqlQuery;
    }
    return {
        matcher,
        where,
    };
}
const RULE = {
    id: 'query-from-view',
    title: 'Queries from view',
    Options,
    impactDomain: 'Maintainability',
    enumerateScope: true,
    references: {
        'CWE-1057': new url_1.URL('https://cwe.mitre.org/data/definitions/1057.html'),
    },
    description: (0, parseRuleDescription_1.default)('queryFromView'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#query-from-view',
    build,
};
exports.default = RULE;

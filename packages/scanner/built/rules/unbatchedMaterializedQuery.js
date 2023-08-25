"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const visit_1 = require("../database/visit");
const url_1 = require("url");
const parseRuleDescription_1 = __importDefault(require("./lib/parseRuleDescription"));
function isMaterialized(e) {
    return e.ancestors().some(({ labels }) => labels.has(DAOMaterialize));
}
function isApplicable(e, appMapIndex) {
    try {
        const ast = appMapIndex.sqlAST(e);
        let isSelect = false;
        let isCount = false;
        let hasLimitClause = false;
        let isMetadataQuery = false;
        if (ast) {
            const metadataTableNames = ['sqlite_master'];
            (0, visit_1.visit)(ast, {
                'statement.select': (statement) => {
                    isSelect = true;
                    if (statement.result &&
                        Array.isArray(statement.result) &&
                        statement.result.length === 1 &&
                        statement.result[0].type === 'function' &&
                        statement.result[0].name.name === 'count') {
                        isCount = true;
                    }
                },
                'expression.limit': () => {
                    hasLimitClause = true;
                },
                'identifier.table': (identifier) => {
                    if (metadataTableNames.includes(identifier.name)) {
                        isMetadataQuery = true;
                    }
                },
            });
        }
        const isBatched = hasLimitClause || isCount || isMetadataQuery;
        return isSelect && !isBatched && isMaterialized(e);
    }
    catch (_) {
        console.warn(`Unable to analyze query "${e.sqlQuery}"`);
        return false;
    }
}
function matcher(event, appMapIndex) {
    if (isApplicable(event, appMapIndex)) {
        return [
            {
                event: event,
                message: `Unbatched materialized SQL query: ${event.sqlQuery}`,
            },
        ];
    }
}
function build() {
    return {
        matcher,
        where: (e) => !!e.sqlQuery,
    };
}
// Example: ActiveRecord::Relation#records
const DAOMaterialize = 'dao.materialize';
const RULE = {
    id: 'unbatched-materialized-query',
    title: 'Unbatched materialized SQL query',
    labels: [DAOMaterialize],
    enumerateScope: true,
    impactDomain: 'Performance',
    references: {
        'CWE-1049': new url_1.URL('https://cwe.mitre.org/data/definitions/1049.html'),
    },
    description: (0, parseRuleDescription_1.default)('unbatchedMaterializedQuery'),
    url: 'https://appland.com/docs/analysis/rules-reference.html#unbatched-materialized-query',
    build,
};
exports.default = RULE;

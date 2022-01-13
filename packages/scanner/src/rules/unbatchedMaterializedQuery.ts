import { buildQueryAST, Event } from '@appland/models';
import { Rule, RuleLogic } from '../types';
import { visit } from '../database/visit';
import { URL } from 'url';

function isMaterialized(e: Event): boolean {
  return e.ancestors().some(({ labels }) => labels.has(DAOMaterialize));
}

function isApplicable(e: Event): boolean {
  try {
    const ast = buildQueryAST(e.sqlQuery!);
    let isSelect = false;
    let isCount = false;
    let hasLimitClause = false;
    let isMetadataQuery = false;

    if (ast) {
      const metadataTableNames = ['sqlite_master'];

      visit(ast, {
        'statement.select': (statement: any) => {
          isSelect = true;

          if (
            statement.result &&
            Array.isArray(statement.result) &&
            statement.result.length === 1 &&
            statement.result[0].type === 'function' &&
            statement.result[0].name.name === 'count'
          ) {
            isCount = true;
          }
        },
        'expression.limit': () => {
          hasLimitClause = true;
        },
        'identifier.table': (identifier: any) => {
          if (metadataTableNames.includes(identifier.name)) {
            isMetadataQuery = true;
          }
        },
      });
    }

    const isBatched = hasLimitClause || isCount || isMetadataQuery;

    return isSelect && !isBatched && isMaterialized(e);
  } catch (_) {
    console.warn(`Unable to analyze query "${e.sqlQuery!}"`);
    return false;
  }
}

function build(): RuleLogic {
  return {
    matcher: (e) => isApplicable(e),
    where: (e) => !!e.sqlQuery,
  };
}

// Example: ActiveRecord::Relation#records
const DAOMaterialize = 'dao.materialize';

export default {
  id: 'unbatched-materialized-query',
  title: 'Unbatched materialized SQL query',
  labels: [DAOMaterialize],
  scope: 'command',
  enumerateScope: true,
  impactDomain: 'Performance',
  references: {
    'CWE-1049': new URL('https://cwe.mitre.org/data/definitions/1049.html'),
  },
  build,
} as Rule;

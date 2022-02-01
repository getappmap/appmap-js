import { Event } from '@appland/models';
import { AppMapIndex, QueryAST, Rule, RuleLogic } from '../types';
import { visit } from '../database/visit';
import { URL } from 'url';
import parseRuleDescription from './lib/parseRuleDescription';

function isMaterialized(event: Event): boolean {
  return event.ancestors().some(({ labels }) => labels.has(DAOMaterialize));
}

function isApplicable(event: Event, ast: QueryAST | undefined): boolean {
  if (!ast) return false;

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

  return isSelect && !isBatched && isMaterialized(event);
}

function build(): RuleLogic {
  return {
    matcher: (scopeEvent: Event, appMapIndex: AppMapIndex) =>
      appMapIndex
        .forType('sql_query', scopeEvent)
        .filter((event) => isApplicable(event, appMapIndex.sqlAST(event)))
        .map((event) => ({ level: 'warning', event })),
  };
}

// Example: ActiveRecord::Relation#records
const DAOMaterialize = 'dao.materialize';

export default {
  id: 'unbatched-materialized-query',
  title: 'Unbatched materialized SQL query',
  labels: [DAOMaterialize],
  scope: 'command',
  enumerateScope: false,
  impactDomain: 'Performance',
  references: {
    'CWE-1049': new URL('https://cwe.mitre.org/data/definitions/1049.html'),
  },
  description: parseRuleDescription('unbatchedMaterializedQuery'),
  url: 'https://appland.com/docs/analysis/rules-reference.html#unbatched-materialized-query',
  build,
} as Rule;

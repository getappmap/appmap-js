import { buildQueryAST, Event, EventNavigator } from '@appland/models';
import { isSelect } from '../database';
import { AssertionSpec } from '../types';
import Assertion from '../assertion';

const astHasKey = (ast: any, key: string): boolean => {
  return !!astFindNode(ast, (node: any) => Object.keys(node).includes(key));
};

const astFindNode = (ast: any, test: (node: any) => boolean): any => {
  if (Array.isArray(ast)) {
    return ast.find((node) => astFindNode(node, test));
  }
  if (typeof ast !== 'object') {
    return false;
  }
  if (test(ast)) {
    return ast;
  }

  return Object.values(ast).some((node) => astFindNode(node, test));
};

function hasLimitClause(ast: any): boolean {
  return astHasKey(ast, 'limit');
}

function isCount(ast: any): boolean {
  const selectStatement = astFindNode(
    ast,
    (node: any) => node.type === 'statement' && node.variant === 'select'
  );
  if (!selectStatement) {
    return false;
  }
  if (!selectStatement.result || Array.isArray(selectStatement.result)) {
    return false;
  }
  const result: Array<any> = selectStatement.result;

  return result.length === 1 && result[0].type === 'function' && result[0].name.name === 'count';
}

function isMetadataQuery(ast: any): boolean {
  const metadataTableNames = ['sqlite_master'];
  return astFindNode(
    ast,
    (node: any) => node.variant === 'table' && metadataTableNames.includes(node.name)
  );
}

function isBatched(e: Event): boolean {
  const ast = buildQueryAST(e.sqlQuery!);
  //console.warn(JSON.stringify(ast, null, 2));
  return hasLimitClause(ast) || isCount(ast) || isMetadataQuery(ast);
  // return true;
}

function isMaterialized(e: Event): boolean | undefined {
  for (const ancestor of new EventNavigator(e).ancestors()) {
    if (ancestor.event.codeObject.labels.has(DAOMaterialize)) {
      return true;
    }
  }
}

function scanner(): Assertion {
  return Assertion.assert(
    'unbatched-materialized-query',
    'Unbatched materialized SQL query',
    (e: Event) => isSelect(e.sqlQuery!) && !isBatched(e) && isMaterialized(e),
    (assertion: Assertion): void => {
      assertion.where = (e: Event) => !!e.sqlQuery;
      assertion.description = `Unbatched materialized SQL query`;
    }
  );
}

// Example: ActiveRecord::Relation#records
const DAOMaterialize = 'dao.materialize';

export default {
  Labels: [DAOMaterialize],
  scope: 'command',
  enumerateScope: true,
  scanner,
} as AssertionSpec;

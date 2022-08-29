import sha256 from 'crypto-js/sha256';
import normalize from '../sql/normalize';
import parse from '../sql/parse';

// returns a JSON of SQL query AST
// with all literals replaced by variables
// and all variable names removed
export function abstractSqlAstJSON(query, databaseType) {
  const ast = parse(query);
  if (!ast) return normalize(query, databaseType);

  return JSON.stringify(ast, (_, value) => {
    if (value === null) return null;

    switch (value.type) {
      case 'variable':
      case 'literal':
        return { type: 'variable' };
      default:
        return value;
    }
  });
}

// Returns a string suitable for durable identification of a call event
// that's independent of parameters and return values.
// For SQL queries, it's a JSON of abstract query AST.
// For HTTP queries, it's the method plus normalized path info.
// For function calls it's the qualified function id.
// TODO: This can be removed/deprecated when the current hash algorithm is removed.
function callEventToString(event) {
  const { sqlQuery, route } = event;
  if (sqlQuery) return abstractSqlAstJSON(sqlQuery, event.sql.database_type);
  if (route) return route;
  return event.qualifiedMethodId;
}

// Returns a short string (hash) suitable for durable identification
// of a call event that's independent of parameters and return values.
// For SQL queries, it considers the abstract query (ignoring differences in literal values).
// For HTTP queries, it considers the method plus normalized path info.
// For function calls it's the qualified function id.
// Non-call events will throw an error.
export default function hashEvent(event) {
  if (event.event !== 'call') throw new Error('tried to hash a non-call event');
  return sha256(callEventToString(event)).toString();
}

import sqliteParser from '@appland/sql-parser';
import ParseError from './parseError';
import reportParseError from './sqlErrorHandler';

export default function parse(sql) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  try {
    return sqliteParser(parseSQL);
  } catch (e) {
    reportParseError(new ParseError(e.message, parseSQL));
    return null;
  }
}

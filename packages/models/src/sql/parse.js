import sqliteParser from '@appland/sql-parser';
import ParseError from './parseError';
import { nopErrorCallback } from './nopErrorCallback';

export default function parse(sql, errorCallback = nopErrorCallback) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  try {
    return sqliteParser(parseSQL);
  } catch (e) {
    errorCallback(new ParseError(e.message, parseSQL));
    return null;
  }
}

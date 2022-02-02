import sqliteParser from '@appland/sql-parser';
import { warn } from './log';

export default function parse(sql) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  try {
    return sqliteParser(parseSQL);
  } catch (e) {
    warn(`Unable to parse ${parseSQL} : ${e.message}`);
    return null;
  }
}

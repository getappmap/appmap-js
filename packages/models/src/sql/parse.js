import sqliteParser from '@appland/sql-parser';

export default function parse(sql, errorCallback = () => {}) {
  const parseSQL = sql.replace(/\s+returning\s+\*/i, '');
  try {
    return sqliteParser(parseSQL);
  } catch (e) {
    errorCallback(e.message, parseSQL);
    return null;
  }
}

import readIndexFile from '../readIndexFile';

export default function collectSQLQueries(appmapCountBySQLQueryCount: Record<string, number>) {
  return async (appmap: string) => {
    const sqlQueries = await readIndexFile(appmap, 'canonical.sqlNormalized.json');
    const sqlQueryCount = String(sqlQueries.length);
    if (!appmapCountBySQLQueryCount[sqlQueryCount]) appmapCountBySQLQueryCount[sqlQueryCount] = 1;
    else appmapCountBySQLQueryCount[sqlQueryCount] = appmapCountBySQLQueryCount[sqlQueryCount] + 1;
  };
}

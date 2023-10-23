import readIndexFile from '../readIndexFile';

export function collectSQLTables(sqlTables: Set<string>) {
  return async (appmap: string) => {
    const tables: string[] = await readIndexFile(appmap, 'canonical.sqlTables.json');
    if (!tables) return;

    for (const table of tables) sqlTables.add(table);
  };
}

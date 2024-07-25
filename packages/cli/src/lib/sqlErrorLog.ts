import { ParseError } from '@appland/models';
import { open } from 'fs/promises';

const SqlErrors = new Set();
const SqlParseErrorFileName = 'sql_warning.txt';
let SqlParseErrorFileOpened = false;

async function writeErrorToFile(error: ParseError) {
  const flags = SqlParseErrorFileOpened ? 'a' : 'w';
  SqlParseErrorFileOpened = true;
  const msg = [String(error), ''].join('\n');
  try {
    open(SqlParseErrorFileName, flags).then((handle) => {
      handle.write(msg).finally(handle.close.bind(handle));
    });
  } catch (e) {
    console.warn(e);
    console.warn(`SQL Error: ${msg}`);
  }
}

export default function sqlErrorLog(parseError: ParseError) {
  if (process.env['APPMAP_SQL_WARNING'] && !SqlErrors.has(parseError.sql)) {
    writeErrorToFile(parseError);
    SqlErrors.add(parseError.sql);
  }
}

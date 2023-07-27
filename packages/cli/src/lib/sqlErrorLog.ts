import { ParseError } from '@appland/models';
import { open } from 'fs/promises';

const SqlErrors = new Set();
const SqlParseErrorFileName = 'sql_warning.txt';
let SqlParseErrorFileOpened = false;

async function writeErrorToFile(error: ParseError) {
  const flags = SqlParseErrorFileOpened ? 'a' : 'w';
  SqlParseErrorFileOpened = true;
  open(SqlParseErrorFileName, flags).then((handle) => {
    handle.write([error.toString(), ''].join('\n')).finally(handle.close.bind(handle));
  });
}

export default function sqlErrorLog(parseError: ParseError) {
  if (!SqlErrors.has(parseError.sql)) {
    writeErrorToFile(parseError);
    SqlErrors.add(parseError.sql);
  }
}

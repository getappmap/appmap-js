import { ParseError } from '@appland/models';
import { FileHandle, open } from 'fs/promises';

const SqlErrors = new Set();
const SqlParseErrorFileName = 'sql_warning.txt';
let SqlParseErrorFile: FileHandle | undefined;

async function writeErrorToFile(error: ParseError) {
  if (!SqlParseErrorFile) SqlParseErrorFile = await open(SqlParseErrorFileName, 'w');

  SqlParseErrorFile.write([error.toString(), ''].join('\n'));
}

process.on('exit', () => {
  if (SqlParseErrorFile) SqlParseErrorFile.close();

  SqlParseErrorFile = undefined;
});

export default function sqlErrorLog(parseError: ParseError) {
  if (!SqlErrors.has(parseError.sql)) {
    writeErrorToFile(parseError);
    SqlErrors.add(parseError.sql);
  }
}

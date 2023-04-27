/* eslint-disable @typescript-eslint/no-var-requires */

const SqlErrors = new Set();
const SqlParseErrorFileName = 'sql_parse_error.txt';
let SqlParseErrorFile;
let writeError;

async function writeErrorToFile(error) {
  const { open } = require('fs/promises');

  if (!SqlParseErrorFile) SqlParseErrorFile = await open(SqlParseErrorFileName, 'w');

  SqlParseErrorFile.write([error.toString(), ''].join('\n'), (err) => {
    if (err) console.debug(err);
  });
}

function writeErrorToConsole(error) {
  console.debug(error);
}

function isProcessAvailable() {
  return typeof process !== 'undefined' && process && typeof process.on === 'function';
}

if (isProcessAvailable()) {
  process.on('exit', () => {
    if (SqlParseErrorFile) SqlParseErrorFile.close();

    SqlParseErrorFile = undefined;
  });
  writeError = writeErrorToFile;
} else {
  writeError = writeErrorToConsole;
}

export function nopErrorCallback(parseError) {
  if (!SqlErrors.has(parseError.sql)) {
    writeError(parseError);
    SqlErrors.add(parseError.sql);
  }
}

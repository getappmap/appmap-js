const SqlErrors = new Set();

export function nopErrorCallback(parseError) {
  if (!SqlErrors.has(parseError.sql)) {
    console.debug(`Unable to parse SQL: ${parseError}`);
    SqlErrors.add(parseError.sql);
  }
}

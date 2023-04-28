let warnedAboutSqlErrorHandler = false;
let sqlErrorHandler;

export function getSQLErrorHandler() {
  return sqlErrorHandler;
}

export function setSQLErrorHandler(handler) {
  if (sqlErrorHandler)
    console.warn(`Replacing existing sqlErrorHandler ${sqlErrorHandler} with ${handler}`);

  sqlErrorHandler = handler;
}

export default function reportParseError(parseError) {
  if (sqlErrorHandler) {
    sqlErrorHandler(parseError);
    return;
  }

  if (!warnedAboutSqlErrorHandler) {
    console.debug('No SQL error handler was set. SQL errors will be logged to the console.');
    console.debug('Set a SQL error handling by calling setSQLErrorHandler(handler).');
    warnedAboutSqlErrorHandler = true;
  }

  console.debug(parseError);
}

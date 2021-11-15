type Callback = (statement: any, callbacks?: Record<string, Callback>) => void;

export function parse(statement: any, callbacks?: Record<string, Callback>): void {
  const key = ['type', 'variant']
    .map((propertyName) => statement[propertyName])
    .filter((value) => value)
    .join('.');

  const parsers = [];
  if (callbacks !== undefined && key in callbacks) {
    parsers.push(callbacks[key]);
  }
  parsers.push(parseStatement);
  parsers.forEach((parser) => parser(statement, callbacks));
}

function parseStatement(statement: any, callbacks?: Record<string, Callback>): void {
  const reservedWords = ['type', 'variant', 'name', 'value'];
  Object.keys(statement)
    .filter((property) => !reservedWords.includes(property))
    .map((propertyName) => statement[propertyName])
    .forEach((property) => {
      if (Array.isArray(property)) {
        property.forEach((statement: any) => parse(statement, callbacks));
      } else if (typeof property === 'object') {
        parse(property, callbacks);
      } else if (typeof property === 'string' || typeof property === 'boolean') {
        // pass
      } else {
        console.warn(`Unrecognized subexpression: ${typeof property} ${property}`);
      }
    });
}

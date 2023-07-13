import { CodeObjectType } from './codeObjectType';

function isExcludedParentType(type) {
  return [CodeObjectType.HTTP, CodeObjectType.DATABASE, CodeObjectType.EXTERNAL_SERVICE].includes(
    type
  );
}

export default function codeObjectId(codeObject, tokens = []) {
  const { parent } = codeObject;

  // If it's a route, query, or external service we don't need to include the parent name
  //  because it's always the same ('HTTP server requests' for route and 'Database' for queries).
  // This mirrors the VS Code implementation.
  if (parent && !isExcludedParentType(parent.type)) {
    codeObjectId(parent, tokens);

    let separator;
    switch (codeObject.parent.type) {
      case CodeObjectType.PACKAGE:
        separator = '/';
        break;
      case CodeObjectType.CLASS:
        separator = '::';
        break;
      default:
        separator = '->';
    }

    if (codeObject.type === CodeObjectType.FUNCTION) {
      separator = 'static' in codeObject && codeObject.static ? '.' : '#';
    }

    tokens.push(separator);
  }

  tokens.push(codeObject.name);

  return tokens;
}

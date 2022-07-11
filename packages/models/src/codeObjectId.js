import { CodeObjectType } from './codeObjectType';

export default function codeObjectId(codeObject, tokens = []) {
  if (codeObject.parent) {
    codeObjectId(codeObject.parent, tokens);

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

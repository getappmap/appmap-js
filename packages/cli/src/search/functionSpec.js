// @ts-check

function matchPackage(/** @type string */ name) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.name === name && codeObject.type === 'package';
  fn.toJSON = () => `package ${name}`;
  return fn;
}
function matchClass(/** @type string */ name) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.name === name && codeObject.type === 'class';
  fn.toJSON = () => `class ${name}`;
  return fn;
}
function matchFunction(
  /** @type string */ name,
  /** @type boolean */ isStatic
) {
  const fn = (/** @type import('./types').CodeObject */ codeObject) =>
    codeObject.name === name &&
    codeObject.type === 'function' &&
    codeObject.static === isStatic;
  fn.toJSON = () => `${isStatic ? 'static ' : ''}function ${name}`;
  return fn;
}

class FunctionSpec {
  constructor(
    /** @type string[] */ packageNames,
    /** @type string[] */ classNames,
    /** @type boolean */ isStatic,
    /** @type string */ functionName
  ) {
    const packageTokens = packageNames.map(matchPackage);
    const classTokens = classNames.map(matchClass);
    const functionToken = matchFunction(functionName, isStatic);
    this.tokens = packageTokens.concat(classTokens).concat([functionToken]);
  }
}

module.exports = FunctionSpec;

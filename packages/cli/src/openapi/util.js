const { buildAppMap } = require('@appland/models');

const unrecognizedTypes = new Set();

function classNameToOpenAPIType(className) {
  if (!className || className === '') {
    return 'unknown';
  }

  const mapRubyType = (t) => {
    switch (t) {
      case 'array':
        return 'array';
      case 'hash':
      case 'activesupport::hashwithindifferentaccess':
        return 'object';
      case 'nilclass':
        return 'string';
      case 'trueclass':
      case 'falseclass':
        return 'boolean';
      case 'string':
        return 'string';
      default:
        return undefined;
    }
  };

  const mapPythonType = (t) => {
    if (!t.startsWith('builtins.')) {
      return undefined;
    }

    switch (t.substr(9)) {
      case 'bool':
        return 'boolean';
      case 'dict':
        return 'object';
      case 'int':
        return 'integer';
      case 'list':
        return 'array';
      case 'str':
        return 'string';
      default:
        return undefined;
    }
  };

  const mapJavaType = (t) => {
    switch (t) {
      case 'java.lang.string':
        return 'string';
      default:
        return undefined;
    }
  };

  const mapper = (t) => mapRubyType(t) || mapPythonType(t) || mapJavaType(t);
  const mapped = mapper(className.toLowerCase());
  if (!mapped && !unrecognizedTypes.has(className)) {
    console.warn(
      `Warning: Don't know how to map "${className}" to an OpenAPI type. You'll need to update the generated file.`
    );
    unrecognizedTypes.add(className);
    return className;
  }
  return mapped;
}

function messageToOpenAPISchema(message) {
  const type = classNameToOpenAPIType(message.class);
  const result = { type };
  /*
  if (message.value) {
    let example;
    try {
      example = JSON.parse(message.value);
    } catch (e) {
      example = message.value;
    }
    if (example && example !== '') {
      result.example = example.toString();
    }
  }
  */
  if (type === 'array') {
    // This is our best guess right now.
    result.items = { type: 'string' };
  } else if (type === 'object' && message.properties) {
    result.properties = message.properties.reduce((memo, msgProperty) => {
      // eslint-disable-next-line no-param-reassign
      memo[msgProperty.name] = {
        type: classNameToOpenAPIType(msgProperty.class),
      };
      return memo;
    }, {});
  }

  return result;
}

function parseHTTPServerRequests(source, collector) {
  const appmap = buildAppMap().source(source).normalize().build();

  appmap.events.filter((e) => e.httpServerRequest).forEach(collector);
}

function ensureString(value) {
  if (Array.isArray(value)) {
    return value.join('');
  }
  return value.toString();
}

function bestPathInfo(httpServerRequest) {
  return ensureString(
    httpServerRequest.normalized_path_info || httpServerRequest.path_info || ''
  );
}

module.exports = {
  bestPathInfo,
  messageToOpenAPISchema,
  parseHTTPServerRequests,
};

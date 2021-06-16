const { buildAppMap } = require('@appland/models');

function classNameToSwaggerType(className) {
  let typeName = className;
  if (!typeName || typeName === '') {
    return 'unknown';
  }
  typeName = typeName.toLowerCase();

  switch (typeName) {
    case 'hash':
    case 'activesupport::hashwithindifferentaccess':
      return 'object';
    case 'nilclass':
      return 'string';
    case 'trueclass':
    case 'falseclass':
      return 'boolean';
    default:
      return typeName;
  }
}

function messageToSwaggerSchema(message) {
  const type = classNameToSwaggerType(message.class);
  const result = { type };
  if (message.value) {
    let example;
    try {
      example = JSON.parse(message.value);
    } catch (e) {
      example = message.value;
    }
    /*
    if (example && example !== '') {
      result.example = example.toString();
    }
    */
  }
  if (type === 'array') {
    // This is our best guess right now.
    result.items = { type: 'string' };
  } else if (type === 'object' && message.properties) {
    result.properties = message.properties.reduce((memo, msgProperty) => {
      // eslint-disable-next-line no-param-reassign
      memo[msgProperty.name] = {
        type: classNameToSwaggerType(msgProperty.class),
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
  messageToSwaggerSchema,
  parseHTTPServerRequests,
};

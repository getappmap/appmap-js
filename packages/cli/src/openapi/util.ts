import { ParameterObject, ParameterProperty } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { verbose } from '../utils';

const unrecognizedTypes = new Set();

interface Scheme {
  schemeId: string;
  scheme: OpenAPIV3.SecuritySchemeObject;
}

function parseScheme(authorization: string): Scheme {
  const tokens = authorization.split(/\s/);
  if (tokens.length === 1) {
    return {
      schemeId: 'api_key',
      scheme: {
        type: 'apiKey',
        name: 'authorization',
        in: 'header',
      } as OpenAPIV3.ApiKeySecurityScheme,
    };
  }

  const schemeId = tokens[0].toLowerCase();
  return {
    schemeId,
    scheme: {
      type: 'http',
      scheme: schemeId,
    } as OpenAPIV3.HttpSecurityScheme,
  };
}

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
    if (verbose()) {
      console.warn(
        `Warning: Don't know how to map "${className}" to an OpenAPI type. You'll need to update the generated file.`
      );
    }
    unrecognizedTypes.add(className);
    return 'object';
  }
  return mapped;
}

function messageToOpenAPISchema(message: ParameterObject): any {
  const type = classNameToOpenAPIType(message.class);
  const result = { type } as any;
  if (type === 'array') {
    // This is our best guess right now.
    result.items = { type: 'string' };
  } else if (type === 'object' && message.properties) {
    result.properties = message.properties.reduce(
      (memo, msgProperty: ParameterProperty) => {
        const type = classNameToOpenAPIType(msgProperty.class);
        if (type === 'array') {
          // eslint-disable-next-line no-param-reassign
          memo[msgProperty.name] = {} as OpenAPIV3.ArraySchemaObject;
        } else {
          // eslint-disable-next-line no-param-reassign
          memo[msgProperty.name] = {
            type,
          } as OpenAPIV3.NonArraySchemaObject;
        }
        return memo;
      },
      {} as Record<
        string,
        OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject
      >
    );
  }

  return result;
}

function ensureString(value: any): string {
  if (Array.isArray(value)) {
    return value.join('');
  }
  return value.toString();
}

export { ensureString, messageToOpenAPISchema, parseScheme };

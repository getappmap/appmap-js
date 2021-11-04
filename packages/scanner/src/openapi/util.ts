import { ParameterObject, ParameterProperty } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';

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

function classNameToOpenAPIType(
  className: string
): OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3.ArraySchemaObjectType {
  let typeName = className;
  if (!typeName || typeName === '') {
    return 'string';
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
      return typeName as OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3.ArraySchemaObjectType;
  }
}

function messageToOpenAPISchema(message: ParameterObject): any {
  const type = classNameToOpenAPIType(message.class);
  const result = { type } as any;
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
    result.properties = message.properties.reduce((memo, msgProperty: ParameterProperty) => {
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
    }, {} as Record<string, OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject>);
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

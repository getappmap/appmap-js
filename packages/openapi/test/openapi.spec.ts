import { readFile } from 'fs/promises';

import { messageToOpenAPISchema } from '../src/util';
import Model from '../src/model';
import SecuritySchemes from '../src/securitySchemes';
import { buildAppMap } from '@appland/models';
import { rpcRequestForEvent } from '../src/rpcRequest';
import { OpenAPIV3 } from 'openapi-types';

type ClassName = string;
type SchemaObjectType = OpenAPIV3.ArraySchemaObjectType | OpenAPIV3.NonArraySchemaObjectType;

const message = (c: ClassName) => ({ message: { class: c } });
const expected = (t?: SchemaObjectType, i?: SchemaObjectType) => {
  if (!t) return { expected: undefined };

  const r: any = { expected: { type: t } };
  if (i) {
    r.expected['items'] = { type: i };
  }
  return r;
};

const mapping = (c: ClassName, t?: SchemaObjectType, i?: SchemaObjectType) => ({
  ...message(c),
  ...expected(t, i),
});

const multi = (classes: ClassName[], t: SchemaObjectType) => {
  return classes.map((c) => ({ ...message(c), ...expected(t) }));
};

const mappingExamples = (mappings: any) => {
  mappings.forEach((m: any) => {
    it(`maps from ${m.message.class} to ${m.expected?.type}`, () => {
      const actual = messageToOpenAPISchema(m.message);
      expect(actual).toStrictEqual(m.expected);
    });
  });
};

describe('openapi', () => {
  it('works as expected', async () => {
    const appmapData = JSON.parse(
      (await readFile('test/data/Users_signup_invalid_signup_information.appmap.json')).toString()
    );

    const model = new Model();
    const securitySchemes = new SecuritySchemes();
    const appmap = buildAppMap().source(appmapData).normalize().build();
    appmap.events
      .filter((e) => e.httpServerRequest)
      .forEach((request) => model.addRpcRequest(rpcRequestForEvent(request)!));

    // TODO: This is weak, we need an example with auth
    expect(securitySchemes.openapi()).toEqual({});
    expect(model.openapi()).toEqual({
      '/signup': {
        get: {
          responses: {
            '200': {
              content: {
                'text/html': {},
              },
              description: 'OK',
            },
          },
        },
      },
      '/users': {
        post: {
          responses: {
            '200': {
              content: {
                'text/html': {},
              },
              description: 'OK',
            },
          },
          requestBody: {
            content: {
              'application/x-www-form-urlencoded': {
                schema: {
                  type: 'object',
                  properties: {
                    user: {
                      type: 'object',
                      properties: {
                        name: {
                          type: 'string',
                        },
                        email: {
                          type: 'string',
                        },
                        password: {
                          type: 'string',
                        },
                        password_confirmation: {
                          type: 'string',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});

describe('messageToOpenAPISchema', () => {
  describe('for Ruby types', () => {
    const rubyMappings = [
      mapping('Array', 'array', 'string'),
      mapping('NilClass', undefined),
      mapping('MyClass', 'object'),
      ...multi(['Hash', 'ActiveSupport::HashWithIndifferentAccess'], 'object'),
      ...multi(['TrueClass', 'FalseClass'], 'boolean'),
    ];

    mappingExamples(rubyMappings);
  });

  describe('for Python type', () => {
    const pythonMappings = [
      mapping('builtins.bool', 'boolean'),
      mapping('builtins.dict', 'object'),
      mapping('builtins.int', 'integer'),
      mapping('builtins.list', 'array', 'string'),
      mapping('builtins.str', 'string'),
      mapping('MyPythonClass', 'object'),
    ];

    mappingExamples(pythonMappings);
  });

  describe('for Java Types', () => {
    const javaMappings = [
      mapping('java.lang.String', 'string'),
      mapping('com.example.MyClass', 'object'),
    ];

    mappingExamples(javaMappings);
  });
});

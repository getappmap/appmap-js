import { readFile } from 'fs/promises';

import { messageToOpenAPISchema } from '../../src/openapi/util';
import Model from '../../src/openapi/model';
import SecuritySchemes from '../../src/openapi/securitySchemes';
import { buildAppMap } from '@appland/models';
import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';

const message = (c) => ({ message: { class: c } });
const expected = (t, i?) => {
  const r = { expected: { type: t } };
  if (i) {
    r.expected['items'] = { type: i };
  }
  return r;
};

const mapping = (c, t, i?) => ({
  ...message(c),
  ...expected(t, i),
});

const multi = (classes, t) => {
  return classes.map((c) => ({ ...message(c), ...expected(t) }));
};

const mappingExamples = (mappings) => {
  mappings.forEach((m) => {
    it(`maps from ${m.message.class} to ${m.expected.type}`, () => {
      const actual = messageToOpenAPISchema(m.message);
      expect(actual).toStrictEqual(m.expected);
    });
  });
};

describe('openapi', () => {
  it('works as expected', async () => {
    const appmapData = JSON.parse(
      (
        await readFile(
          'tests/fixtures/appmaps/Users_signup_invalid_signup_information.appmap.json'
        )
      ).toString()
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
      mapping('NilClass', 'string'),
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

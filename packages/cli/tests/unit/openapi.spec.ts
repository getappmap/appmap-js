import { verbose } from '../../src/utils';
import { default as openapi } from '../../src/cmds/openapi';
import assert from 'assert';

describe('OpenAPI', () => {
  beforeAll(async () => verbose(process.env.DEBUG === 'true'));

  it('handles valid and malformed HTTP server requests', async () => {
    const cmd = new openapi.OpenAPICommand('tests/unit/fixtures/malformedHTTPServerRequest');
    const result = await cmd.execute();
    assert.deepStrictEqual(result, {
      paths: {
        '/*unmatched_route': {
          get: {
            responses: {
              '200': {
                content: {},
                description: 'OK',
              },
            },
          },
        },
      },
      securitySchemes: {},
    });
    assert.deepStrictEqual(cmd.errors, []);
  });
});

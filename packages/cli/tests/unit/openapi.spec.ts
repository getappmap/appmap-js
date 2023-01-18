import { verbose } from '../../src/utils';
import { default as openapi } from '../../src/cmds/openapi';
import assert from 'assert';
import path from 'path';

describe('OpenAPI', () => {
  const fixtureDirectory = 'tests/unit/fixtures/malformedHTTPServerRequest';

  beforeAll(async () => verbose(process.env.DEBUG === 'true'));

  it('handles valid and malformed HTTP server requests', async () => {
    const cmd = new openapi.OpenAPICommand(fixtureDirectory);
    const [result, numAppMaps] = await cmd.execute();
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
    assert.deepStrictEqual(numAppMaps, 1);
  });

  it('accepts a relative --appmap-dir path', async () => {
    const cmd = new openapi.OpenAPICommand(fixtureDirectory);
    const [result] = await cmd.execute();
    assert(Object.keys(result.paths).length);
  });

  it('accepts an absolute --appmap-dir path', async () => {
    const cmd = new openapi.OpenAPICommand(path.resolve(fixtureDirectory));
    const [result] = await cmd.execute();
    assert(Object.keys(result.paths).length);
  });
});

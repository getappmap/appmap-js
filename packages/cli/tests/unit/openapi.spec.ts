import { verbose } from '@appland/common/src/utils';
import { default as openapi, fileSizeFilter } from '../../src/cmds/openapi';
import assert from 'assert';
import path from 'path';

describe('OpenAPI', () => {
  const malformedHTTPServerRequestDir = 'tests/unit/fixtures/malformedHTTPServerRequest';
  const rubyDir = 'tests/unit/fixtures/ruby';

  beforeAll(async () => verbose(process.env.DEBUG === 'true'));

  it('handles valid and malformed HTTP server requests', async () => {
    const cmd = new openapi.OpenAPICommand(malformedHTTPServerRequestDir);
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
    const cmd = new openapi.OpenAPICommand(rubyDir);
    const [result] = await cmd.execute();
    expect(Object.keys(result.paths)).toHaveLength(2);
  });

  it('accepts an absolute --appmap-dir path', async () => {
    const cmd = new openapi.OpenAPICommand(path.resolve(rubyDir));
    const [result] = await cmd.execute();
    expect(Object.keys(result.paths)).toHaveLength(2);
  });

  it('produces 0-length output when all AppMaps are filtered out', async () => {
    const cmd = new openapi.OpenAPICommand(path.resolve(rubyDir));
    cmd.filter = async (_file: string) => ({ enable: false });
    const [result] = await cmd.execute();
    expect(Object.keys(result.paths)).toHaveLength(0);
  });

  it('respects max file size', async () => {
    const cmd = new openapi.OpenAPICommand(path.resolve(rubyDir));
    // -rw-r--r--   1 xxx  staff  24248 Jan 10 15:50 revoke_api_key.appmap.json
    // -rw-r--r--   1 xxx  staff  47718 Jan 10 15:50 user_page_scenario.appmap.json
    cmd.filter = fileSizeFilter(30000);
    const [result] = await cmd.execute();
    console.warn(result.paths);
    expect(Object.keys(result.paths)).toHaveLength(1);
  });
});

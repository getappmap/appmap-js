import { verbose } from '../../src/utils';
import { default as openapi, ignorePaths } from '../../src/cmds/openapi';
import assert from 'assert';
import path from 'path';
import { Exclusion } from '../../src/config/openApi';

describe('OpenAPI', () => {
  const fixtureDirectory = 'tests/unit/fixtures/malformedHTTPServerRequest';

  beforeAll(async () => verbose(process.env.DEBUG === 'true'));

  it('handles valid and malformed HTTP server requests', async () => {
    const cmd = new openapi.OpenAPICommand(fixtureDirectory);
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

  it('accepts a relative --appmap-dir path', async () => {
    const cmd = new openapi.OpenAPICommand(fixtureDirectory);
    const result = await cmd.execute();
    assert(Object.keys(result.paths).length);
  });

  it('accepts an absolute --appmap-dir path', async () => {
    const cmd = new openapi.OpenAPICommand(path.resolve(fixtureDirectory));
    const result = await cmd.execute();
    assert(Object.keys(result.paths).length);
  });

  describe('ignore configuration', () => {
    it('ignores paths as expected', () => {
      const methodDefinition = {};
      let paths = {
        '/admin': {
          get: methodDefinition,
          post: methodDefinition,
        },
        '/users': {
          get: methodDefinition,
          head: methodDefinition,
          post: methodDefinition,
        },
      };
      let exclusions: Array<Exclusion> = ['/admin', { path: '/users', methods: ['GET', 'HEAD'] }];
      const result = ignorePaths(paths, exclusions);
      assert.deepStrictEqual(result, {
        '/users': {
          post: methodDefinition,
        },
      });
    });

    it('ignores paths with globs', () => {
      const methodDefinition = {};
      let paths = {
        '/users/{id}': {
          get: methodDefinition,
          post: methodDefinition,
        },
        '/users/{id}/friends': {
          get: methodDefinition,
        },
        '/user': {
          get: methodDefinition,
        },
      };

      const result = ignorePaths(paths, ['/users/*']);
      assert.deepStrictEqual(result, {
        '/user': {
          get: methodDefinition,
        },
      });
    });

    it('negates exlusions when prefixed with a bang', () => {
      const methodDefinition = {};
      let paths = {
        '/users/{id}': {
          get: methodDefinition,
          post: methodDefinition,
        },
        '/users/{id}/friends': {
          get: methodDefinition,
        },
        '/user': {
          get: methodDefinition,
        },
      };

      const result = ignorePaths(paths, ['/users/*', '!/users/*/*']);
      assert.deepStrictEqual(result, {
        '/users/{id}/friends': {
          get: methodDefinition,
        },
        '/user': {
          get: methodDefinition,
        },
      });
    });

    it('can use a bang and glob to change the default behavior to ignore all', () => {
      const methodDefinition = {};
      let paths = {
        '/users/{id}': {
          get: methodDefinition,
          post: methodDefinition,
        },
        '/users/{id}/friends': {
          get: methodDefinition,
        },
        '/api/friends': {
          post: methodDefinition,
          put: methodDefinition,
          delete: methodDefinition,
        },
      };

      const result = ignorePaths(paths, ['*', '!/api/*']);
      assert.deepStrictEqual(result, {
        '/api/friends': {
          post: methodDefinition,
          put: methodDefinition,
          delete: methodDefinition,
        },
      });
    });

    it('can apply negations to specific methods', () => {
      const methodDefinition = {};
      let paths = {
        '/user': {
          post: methodDefinition,
          put: methodDefinition,
          delete: methodDefinition,
        },
      };

      const result = ignorePaths(paths, [{ path: '/user', methods: ['!POST'] }]);
      assert.deepStrictEqual(result, {
        '/user': {
          post: methodDefinition,
        },
      });
    });

    it('applies exclusions in the order listed', () => {
      const methodDefinition = {};
      let paths = {
        '/user': {
          post: methodDefinition,
          put: methodDefinition,
        },
      };

      const result = ignorePaths(paths, ['/user', '!/user']);
      assert.deepStrictEqual(result, paths);
    });
  });
});

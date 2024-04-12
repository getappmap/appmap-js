import { join } from 'path';
import type { Stats } from '../../../src/rpc/appmap/stats';
import * as statsLib from '../../../src/rpc/appmap/stats';
import promptSuggestionsV1, { fallbackPrompts } from '../../../src/rpc/prompt';

describe('v1.prompt.suggestions', () => {
  const { handler } = promptSuggestionsV1();

  function withStats(stats: Partial<Stats> | Partial<Stats>[], randomValue = 0.123) {
    beforeEach(() => {
      const statsArray = Array.isArray(stats) ? stats : [stats];
      jest.spyOn(Math, 'random').mockReturnValue(randomValue);
      jest.spyOn(statsLib, 'collectStats').mockResolvedValue(
        statsArray.map((stats, i) => ({
          routes: [],
          classes: [],
          tables: [],
          packages: [],
          numAppMaps: 0,
          name: `test-${i}`,
          directory: join('/', 'test', i.toString()),
          ...stats,
        }))
      );
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });
  }

  describe('when there are no AppMaps', () => {
    withStats([]);

    it('returns expected prompts', async () => {
      const prompts = await handler(undefined);
      expect(prompts).toEqual(fallbackPrompts);
    });
  });

  describe('with a single route', () => {
    withStats([{ routes: ['GET /api/users'], numAppMaps: 1 }]);

    it('returns expected prompts', async () => {
      const prompts = await handler(undefined);
      expect(prompts).toEqual([
        {
          name: 'Explain GET /api/users',
          description: expect.stringContaining('describe the behavior of a route'),
          prompt: expect.stringContaining('Describe the overall flow of the route'),
        },
        fallbackPrompts[0],
      ]);
    });
  });

  describe('with many routes', () => {
    withStats(
      [
        {
          routes: [
            'DELETE /api/users',
            'PUT /api/users',
            'GET /',
            'GET /index.html',
            'POST /login',
            'DELETE /session',
          ],
          numAppMaps: 1,
        },
      ],
      0.9999
    );

    it('choses a random high scoring route', async () => {
      const prompts = await handler(undefined);
      expect(prompts).toEqual([
        {
          name: 'Explain PUT /api/users',
          description: expect.stringContaining('describe the behavior of a route'),
          prompt: expect.stringContaining('Describe the overall flow of the route'),
        },
        fallbackPrompts[0],
      ]);
    });
  });

  describe('with a class and a table', () => {
    withStats([
      {
        classes: ['User'],
        tables: ['users'],
        numAppMaps: 1,
      },
    ]);

    it('returns expected prompts', async () => {
      const prompts = await handler(undefined);
      expect(prompts).toEqual([
        {
          name: 'Describe the users table',
          description: expect.stringContaining('usage of a database table in your application'),
          prompt: 'Describe the usage of the table "users"',
        },
        {
          name: 'Describe the User class',
          description: expect.stringContaining(
            'describe the usage and architecture around classes'
          ),
          prompt: 'Describe the behavior and usage of the class "User"',
        },
      ]);
    });
  });

  describe('with multiple tables', () => {
    withStats(
      [
        {
          tables: ['users', 'posts', 'comments', 'likes', 'tags', 'categories'],
          numAppMaps: 1,
        },
      ],
      0.8
    );

    it('returns expected (randomized) prompts', async () => {
      const prompts = await handler(undefined);
      expect(prompts).toEqual([
        {
          name: 'Describe the tags table',
          description: expect.stringContaining('usage of a database table in your application'),
          prompt: 'Describe the usage of the table "tags"',
        },
        fallbackPrompts[0],
      ]);
    });
  });
});

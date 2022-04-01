import buildAppMap from '../../src/appMapBuilder';
import scenario from './fixtures/large_scenario.json';

test('build', () => {
  const appMap = buildAppMap().source(scenario).build();

  const numCodeObjects = appMap.classMap.codeObjects.length;

  expect(numCodeObjects).toEqual(50);
  expect(appMap.events.length).toEqual(815);
  expect(Object.keys(appMap.metadata).length).toEqual(10);
});

test('build with data source in constructor', () => {
  const appMap = buildAppMap(scenario).build();

  const numCodeObjects = appMap.classMap.codeObjects.length;

  expect(numCodeObjects).toEqual(50);
  expect(appMap.events.length).toEqual(815);
  expect(Object.keys(appMap.metadata).length).toEqual(10);
});

describe('normalize', () => {
  const appMap = buildAppMap().source(scenario).normalize().build();

  it('re-index events', () => {
    let eventId = 1;
    appMap.events.forEach((e) => {
      expect(e.id).toEqual(eventId);
      eventId += 1;
    });
  });

  it('balances the stack', () => {
    const stack = [];
    appMap.events.forEach((e) => {
      if (e.isCall()) {
        stack.push(e);
      } else {
        stack.pop();
      }
    });

    expect(stack.length).toEqual(0);
  });

  it('sorts by thread execution order', () => {
    const stack = [];
    let currentThreadId = 0;
    appMap.events.forEach((e) => {
      if (e.isCall()) {
        if (stack.length === 0) {
          currentThreadId = e.thread_id;
        }
        stack.push(e);
      } else {
        stack.pop();
      }

      expect(e.thread_id).toEqual(currentThreadId);
    });
  });

  it('removes credentials from git repository urls', () => {
    function normalizeRepository(repository) {
      const appMapData = {
        metadata: {
          git: { repository },
        },
        events: [],
        classMap: [],
      };

      return buildAppMap(appMapData).normalize().build().metadata.git
        .repository;
    }

    Object.entries({
      'https://github.com/organization/repository':
        'https://github.com/organization/repository',

      'https://username@github.com/organization/repository':
        'https://github.com/organization/repository',

      'http://username:password@github.com/organization/repository':
        'http://github.com/organization/repository',

      'https://username:password@github.com/organization/repository.git':
        'https://github.com/organization/repository.git',
    }).forEach(([actual, expected]) => {
      expect(normalizeRepository(actual)).toEqual(expected);
    });
  });
});

test('prune', () => {
  const desiredSize = 8 /* KB */ * 1024;
  const appMap = buildAppMap(scenario).prune(desiredSize).build();

  const finalSize = JSON.stringify(appMap.events).length;
  expect(finalSize).toBeLessThanOrEqual(desiredSize);
  expect(appMap.events.length).toBeGreaterThan(0);
});

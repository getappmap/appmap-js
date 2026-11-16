import buildAppMap from '../../src/appMapBuilder';
import scenario from './fixtures/large_scenario.json';
import missingEventsScenario from './fixtures/missing_calls.appmap.json';
import updatesScenario from './fixtures/event_updates.json';

describe('build', () => {
  it('creates an AppMap', () => {
    const appMap = buildAppMap().source(scenario).build();

    const numCodeObjects = appMap.classMap.codeObjects.length;

    expect(numCodeObjects).toEqual(50);
    expect(appMap.events.length).toEqual(815);
    expect(Object.keys(appMap.metadata).length).toEqual(10);
  });
  it('overrwrites event with update', () => {
    const appMap = buildAppMap().source(updatesScenario).build();
    expect(appMap.events[0].extra_attribute).toBeUndefined();
    expect(appMap.events[0].http_server_request).not.toBeNull();
    expect(appMap.events[0].http_server_request.normalized_path_info).toEqual(
      '/owners/:ownerId/pets/:petId/edit'
    );
  });
});

test('build with data source in constructor', () => {
  const appMap = buildAppMap(scenario).build();

  const numCodeObjects = appMap.classMap.codeObjects.length;

  expect(numCodeObjects).toEqual(50);
  expect(appMap.events.length).toEqual(815);
  expect(Object.keys(appMap.metadata).length).toEqual(10);
});

describe('normalize', () => {
  describe('with a good scenario', () => {
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

        return buildAppMap(appMapData).normalize().build().metadata.git.repository;
      }

      Object.entries({
        'https://github.com/organization/repository': 'https://github.com/organization/repository',

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

  describe('with missing call events', () => {
    it('removes the associated returns', () => {
      // Previously this would have thrown an exception
      const appMap = buildAppMap(missingEventsScenario).normalize().build();
      expect(appMap.events.length).toEqual(40);
    });
  });

  describe('with returns out of order', () => {
    // Async functions can return after calls made later have started, e.g.
    // appmap-node records the return of an async function when its promise
    // settles.
    const call = (id, methodId) => ({
      id,
      event: 'call',
      thread_id: 0,
      defined_class: 'main',
      method_id: methodId,
      path: 'app/main.mjs',
      static: true,
    });
    const ret = (id, parentId) => ({ id, event: 'return', thread_id: 0, parent_id: parentId });
    const build = (events) => buildAppMap({ events }).normalize().build();
    const describeEvents = (appMap) =>
      appMap.events.map((e) => (e.isCall() ? e.method_id : `return ${e.callEvent.method_id}`));

    it('nests calls made while their caller was still open', () => {
      // https://github.com/getappmap/appmap-js/issues/2430
      const appMap = build([call(1, 'startStudio'), call(2, 'handle'), ret(3, 1), ret(4, 2)]);

      expect(describeEvents(appMap)).toEqual([
        'startStudio',
        'handle',
        'return handle',
        'return startStudio',
      ]);
      const [startStudio, handle] = appMap.events;
      expect(startStudio.children).toEqual([handle]);
      expect(handle.parent).toBe(startStudio);
      expect(appMap.callTree.rootEvent.children.length).toEqual(1);
    });

    it('builds the tree when the returning call is deeper in the stack', () => {
      const appMap = build([
        call(1, 'a'),
        call(2, 'b'),
        call(3, 'c'),
        ret(4, 1),
        ret(5, 3),
        ret(6, 2),
      ]);

      expect(describeEvents(appMap)).toEqual(['a', 'b', 'c', 'return c', 'return b', 'return a']);
      const [a, b, c] = appMap.events;
      expect(a.parent).toBeUndefined();
      expect(b.parent).toBe(a);
      expect(c.parent).toBe(b);
    });

    it('orders children by when they were called', () => {
      const appMap = build([
        call(1, 'a'),
        call(2, 'b'),
        ret(3, 1),
        call(4, 'c'),
        ret(5, 4),
        ret(6, 2),
      ]);

      // c is called after a returns, so it's a child of b, the only open call.
      expect(describeEvents(appMap)).toEqual(['a', 'b', 'c', 'return c', 'return b', 'return a']);
    });

    it('closes calls that never return inside calls that did', () => {
      const appMap = build([call(1, 'a'), call(2, 'b'), ret(3, 1), call(4, 'c'), ret(5, 4)]);

      // c is called after a returns, but b is still open, so c is b's child.
      expect(describeEvents(appMap)).toEqual(['a', 'b', 'c', 'return c', 'return b', 'return a']);
      const [a, b] = appMap.events;
      expect(a.children).toEqual([b]);
    });

    it('gives the returns it adds unused ids', () => {
      const appMap = buildAppMap({
        events: [call(1, 'a'), call(2, 'b'), ret(3, 1), call(4, 'c'), ret(5, 4)],
      }).build();

      expect(appMap.events.map((e) => e.id)).toEqual([1, 2, 4, 5, 6, 3]);
      expect(appMap.events[4].callEvent).toBe(appMap.events[1]);
    });

    it('discards a second return of the same call', () => {
      const appMap = build([call(1, 'a'), call(2, 'b'), ret(3, 2), ret(4, 2), ret(5, 1)]);

      expect(describeEvents(appMap)).toEqual(['a', 'b', 'return b', 'return a']);
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

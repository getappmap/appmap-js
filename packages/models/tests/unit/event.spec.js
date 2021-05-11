import buildAppMap from '../../src/appMapBuilder';
import Event from '../../src/event';
import scenario from './fixtures/large_scenario.json';
import httpScenario from './fixtures/many_requests_scenario.json';

describe('Event', () => {
  describe('with large scenario', () => {
    const appMap = buildAppMap(scenario).normalize().build();

    test('callStack', () => {
      const event = appMap.events.find(
        (e) => e.isCall() && e.methodId === 'getTasks'
      );
      const callStack = event.callStack();

      expect(callStack.length).toEqual(3);
      expect(callStack[0]).toBeInstanceOf(Event);
      expect(callStack[0].methodId).toEqual('takeLeadership');
      expect(callStack[1].methodId).toEqual('recover');
      expect(callStack[2].methodId).toEqual('getTasks');
    });

    test('ancestors', () => {
      const event = appMap.events.find(
        (e) => e.isCall() && e.methodId === 'recover'
      );
      const ancestors = event.ancestors();

      expect(ancestors.length).toEqual(1);
      expect(ancestors[0]).toBeInstanceOf(Event);
      expect(ancestors[0].methodId).toEqual('takeLeadership');
    });

    test('descendants', () => {
      const event = appMap.events.find(
        (e) => e.isCall() && e.methodId === 'recover'
      );
      const descendants = event.descendants();

      expect(descendants.length).toEqual(1);
      expect(descendants[0]).toBeInstanceOf(Event);
      expect(descendants[0].methodId).toEqual('getTasks');
    });
  });

  describe('with web service scenario', () => {
    const appMap = buildAppMap(httpScenario).normalize().build();

    test('get sqlQuery', () => {
      const query = 'SELECT COUNT(*) FROM "spree_stores"';
      const event = appMap.events.find(
        (e) => e.sql_query && e.sql_query.sql === query
      );

      expect(query).toEqual(event.sqlQuery);
    });

    test('get route', () => {
      const event = appMap.events.find(
        (e) =>
          e.http_server_request && e.http_server_request.path_info === '/admin'
      );

      expect(event.route).toEqual('GET /admin');
    });

    test('all events have CodeObjects', () => {
      const callEvents = appMap.events.filter((e) => e.isCall());
      const events = callEvents.filter((e) => e.codeObject.events.includes(e));

      expect(events.length).toEqual(callEvents.length);
    });
  });
});

import buildAppMap from '../../src/appMapBuilder';
import scenario from '../../../components/tests/unit/fixtures/large_scenario.json';

describe('AppMap', () => {
  const appMap = buildAppMap().source(scenario).normalize().build();

  test('version', () => {
    expect(appMap.version).toEqual('1.2');
  });

  test('metadata', () => {
    expect(appMap.metadata.language.name).toEqual('java');
  });

  test('name', () => {
    expect(appMap.name).toEqual('Curator master elect single master');
  });

  test('event tree', () => {
    expect(appMap.rootEvent.count()).toEqual(409);
  });

  describe('serialization', () => {
    it('can be stringified', () => {
      expect(() => JSON.stringify(appMap)).not.toThrow();
    });

    it('outputs the expected JSON for http_server_response', () => {
      const httpServerRequest = {
        id: 1,
        event: 'call',
        thread_id: 1,
        http_server_request: {
          request_method: 'POST',
          path_info: '/user/profile',
          normalized_path_info: '/user/profile',
          headers: {
            Version: 'HTTP/1.0',
            Host: 'localhost',
            'X-Access-Token': '8feb7269-aa44-4ab9-9023-e4543400f744',
            'Content-Type': 'application/json',
            'Content-Length': '177',
          },
        },
        message: [
          {
            name: 'data',
            class: 'ActiveSupport::HashWithIndifferentAccess',
            value: '{profile=>{display_name=>John Doe, bio=>About me, status=>string}}',
            object_id: 30880,
            properties: [
              {
                name: 'profile',
                class: 'ActiveSupport::HashWithIndifferentAccess',
                properties: [
                  { name: 'display_name', class: 'String' },
                  { name: 'bio', class: 'String' },
                  { name: 'status', class: 'String' },
                ],
              },
            ],
          },
          {
            name: 'format',
            class: 'Symbol',
            value: ':json',
            object_id: 10,
          },
          {
            name: 'controller',
            class: 'String',
            value: 'user',
            object_id: 20,
          },
          {
            name: 'action',
            class: 'String',
            value: 'profile',
            object_id: 30,
          },
        ],
      };
      const httpServerResponse = {
        id: 2,
        event: 'return',
        thread_id: 1,
        parent_id: 1,
        elapsed: 0.01,
        elapsed_instrumentation: 0.0005,
        return_value: {
          class: 'Hash',
          value: '{}',
          object_id: 1,
          size: 0,
        },
        http_server_response: {
          status_code: 200,
          headers: {
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'X-Content-Type-Options': 'nosniff',
            'X-Permitted-Cross-Domain-Policies': 'none',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Content-Type': 'application/json; charset=utf-8',
          },
        },
      };
      const httpAppMap = buildAppMap({
        events: [httpServerRequest, httpServerResponse],
        classMap: [],
        metadata: { name: 'test' },
      })
        .normalize()
        .build();

      const result = JSON.parse(JSON.stringify(httpAppMap));
      expect(result.events).toEqual([httpServerRequest, httpServerResponse]);
    });
  });

  test('getEvent', () => {
    for (let i = 0; i < appMap.events.length; i += 1) {
      expect(appMap.getEvent(i + 1)).toEqual(appMap.events[i]);
    }
  });
});

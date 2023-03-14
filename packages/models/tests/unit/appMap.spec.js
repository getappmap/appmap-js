import buildAppMap from '../../src/appMapBuilder';
import LargeAppMapData from '../../../components/tests/unit/fixtures/large_scenario.json';
import TestStatusFailedAppMapData from './fixtures/Hello_failed_failed.appmap.json';

const LargeAppMap = buildAppMap().source(LargeAppMapData).normalize().build();
const TestStatusFailedAppMap = buildAppMap().source(TestStatusFailedAppMapData).normalize().build();

describe('AppMap', () => {
  test('version', () => {
    expect(LargeAppMap.version).toEqual('1.2');
  });

  // https://github.com/getappmap/appmap#metadata
  // Expect language.name, test_status, source_location
  describe('metadata', () => {
    test('language.name is available', () => {
      expect(LargeAppMap.metadata.language.name).toEqual('java');
    });
    test('test_status is available', () => {
      expect(TestStatusFailedAppMap.metadata.test_status).toEqual('failed');
    });
    test('source_location is available', () => {
      expect(TestStatusFailedAppMap.metadata.source_location).toEqual(
        'test/hello_failed_test.rb:9'
      );
    });
  });

  test('name', () => {
    expect(LargeAppMap.name).toEqual('Curator master elect single master');
  });

  test('event tree', () => {
    expect(LargeAppMap.rootEvent.count()).toEqual(409);
  });

  describe('serialization', () => {
    it('can be stringified', () => {
      expect(() => JSON.stringify(LargeAppMap)).not.toThrow();
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

    it('successfully serializes and deserializes an AppMap containing empty locations in code objects', () => {
      const baselineCodeObjects = [
        {
          type: 'class',
          name: '<templates>/Navbar',
          children: [
            {
              type: 'function',
              name: 'render',
              static: false,
              location: '',
            },
          ],
        },
      ];
      const expectedCodeObjects = JSON.stringify([
        {
          type: 'class',
          name: '<templates>/Navbar',
          children: [
            {
              type: 'function',
              name: 'render',
              static: false,
            },
          ],
        },
      ]);

      const baselineAppMap = buildAppMap({
        events: [],
        metadata: {},
        classMap: baselineCodeObjects,
      })
        .normalize()
        .build();
      const reserializedAppMap = buildAppMap(JSON.stringify(baselineAppMap)).normalize().build();

      expect(JSON.stringify(reserializedAppMap.classMap)).toEqual(expectedCodeObjects);
    });
  });

  test('getEvent', () => {
    for (let i = 0; i < LargeAppMap.events.length; i += 1) {
      expect(LargeAppMap.getEvent(i + 1)).toEqual(LargeAppMap.events[i]);
    }
  });
});

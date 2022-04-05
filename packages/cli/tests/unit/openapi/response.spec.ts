import { load, YAMLException } from 'js-yaml';
import { readFileSync } from 'fs';
import Response from '../../../src/openapi/response';
import { Event } from '@appland/models';
import { rpcRequestForEvent } from '../../../src/openapi/rpcRequest';

const fixtureData = load(
  readFileSync(
    'tests/fixtures/appmap_fragments/http_server_response_with_object_list.yaml'
  ).toString()
) as any;

describe('openapi.response', () => {
  it('response', async () => {
    const response = new Response(200);

    const requestEvent = new Event(fixtureData[0]);
    const responseEvent = new Event(fixtureData[1]);
    requestEvent.linkedEvent = responseEvent;

    response.addRpcRequest(rpcRequestForEvent(requestEvent)!);

    //console.log(JSON.stringify(response.openapi(), null, 2));

    expect(response.openapi()).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                scenario_uuid: {
                  type: 'string',
                },
                code_objects: {
                  type: 'array',
                },
                metadata: {
                  type: 'object',
                },
                labels: {
                  type: 'array',
                },
              },
            },
          },
        },
      },
      description: 'OK',
    });
  });
});

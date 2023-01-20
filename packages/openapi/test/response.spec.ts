import { load } from 'js-yaml';
import { readFileSync } from 'fs';
import Response from '../src/response';
import { Event } from '@appland/models';
import { rpcRequestForEvent } from '../src/rpcRequest';

const fixtureData = load(
  readFileSync('test/data/http_server_response_with_object_list.yaml').toString()
) as any;

describe('openapi.response', () => {
  it('response', async () => {
    const response = new Response(200);

    const requestEvent = new Event(fixtureData[0]);
    const responseEvent = new Event(fixtureData[1]);
    requestEvent.linkedEvent = responseEvent;

    response.addRpcRequest(rpcRequestForEvent(requestEvent)!);

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

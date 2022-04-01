import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';
import Model from '../../src/openapi/model';
import { httpClientRequests, httpServerRequests } from './util';

describe('openapi.method', () => {
  it('http_client_request', async () => {
    const request = rpcRequestForEvent(httpClientRequests[0])!;
    expect(request.status).toEqual(200);

    const model = new Model();
    model.addRpcRequest(request);
    expect(model.openapi()).toEqual({
      '/v1/tokens': {
        post: {
          responses: {
            200: { content: { 'application/json': {} }, description: 'OK' },
          },
          security: [{ bearer: [] }],
        },
      },
    });
  });
  it('http_server_request', async () => {
    const request = rpcRequestForEvent(httpServerRequests[0])!;
    expect(request.status).toEqual(201);

    const model = new Model();
    model.addRpcRequest(request);
    expect(model.openapi()).toEqual({
      '/api/mapsets': {
        post: {
          responses: {
            201: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      id: {
                        type: 'integer',
                      },
                      name: {
                        type: 'string',
                      },
                      created_at: {
                        type: 'string',
                      },
                      updated_at: {
                        type: 'string',
                      },
                      user_id: { type: 'integer' },
                      app_id: { type: 'integer' },
                      branch: {
                        type: 'string',
                      },
                      commit: {
                        type: 'string',
                      },
                      environment: {
                        type: 'string',
                      },
                      version: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
              description: 'Created',
            },
          },
          security: [{ bearer: [] }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    mapset: {
                      type: 'object',
                      properties: {
                        app: {
                          type: 'string',
                        },
                        appmaps: {
                          type: 'array',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
  });
});

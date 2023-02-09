import { rpcRequestForEvent } from '../src/rpcRequest';
import Model from '../src/model';
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
  it('http_server_request', () => {
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
                      created_at: {
                        type: 'string',
                      },
                      updated_at: {
                        type: 'string',
                      },
                      user_id: { type: 'integer' },
                      app_id: { type: 'integer' },
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
                          items: {},
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

// similar to https://github.com/getappmap/appmap-ruby/blob/master/spec/util_spec.rb#L21
describe('basePath', () => {
  it('simple path', async () => {
    const path = Model.basePath('/api/users');
    expect(path).toEqual('/api/users');
  });
  it('malformed parameter specs', async () => {
    const path = Model.basePath('/org/o:rg_id');
    expect(path).toEqual('/org/o:rg_id');
  });
  it('already swaggerized path', async () => {
    const path = Model.basePath('/org/{org_id}');
    expect(path).toEqual('/org/{org_id}');
  });
  it('ignores ( and ) to not create blank path', async () => {
    const path = Model.basePath('(/locale/{locale})/api/users/{id}');
    expect(path).toEqual('(/locale/{locale})/api/users/{id}');
  });
});

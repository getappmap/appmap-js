import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';
import Path from '../../src/openapi/path';
import { httpClientRequests } from './util';

describe('openapi.method', () => {
  it('http_client_request', async () => {
    const postTokenRequest = rpcRequestForEvent(httpClientRequests[0])!;
    expect(postTokenRequest.status).toEqual(200);

    const path = new Path();
    path.addRpcRequest(postTokenRequest);
    expect(path.openapi()).toEqual({
      post: {
        responses: { 200: { content: { 'application/json': {} }, description: 'OK' } },
        security: [{ bearer: [] }],
      },
    });
  });
  // TODO: http_server_request
});

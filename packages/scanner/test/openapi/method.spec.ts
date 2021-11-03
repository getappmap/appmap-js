import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';
import Method from '../../src/openapi/method';
import { httpClientRequests } from './util';

describe('openapi.method', () => {
  it('http_client_request', async () => {
    const postTokenRequest = rpcRequestForEvent(httpClientRequests[0])!;
    expect(postTokenRequest.status).toEqual(200);

    const method = new Method();
    method.addRpcRequest(postTokenRequest);
    expect(method.openapi()).toEqual({
      responses: { 200: { content: { 'application/json': {} }, description: 'OK' } },
      security: [{ bearer: [] }],
    });
  });
  // TODO: http_server_request
});

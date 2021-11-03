import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';
import Response from '../../src/openapi/response';
import { httpClientRequests } from './util';

describe('openapi.response', () => {
  it('http_client_request', async () => {
    const postTokenRequest = rpcRequestForEvent(httpClientRequests[0])!;
    expect(postTokenRequest.status).toEqual(200);

    const response = new Response(postTokenRequest.status);
    response.addRpcRequest(postTokenRequest);
    expect(response.openapi()).toEqual({ content: { 'application/json': {} }, description: 'OK' });
  });
  // TODO: http_server_request
});

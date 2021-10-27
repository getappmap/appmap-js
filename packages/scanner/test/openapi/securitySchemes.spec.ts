import { rpcRequestForEvent } from '../../src/openapi/rpcRequest';
import SecuritySchemes from '../../src/openapi/securitySchemes';
import { httpClientRequests } from './util';

describe('openapi.securitySchemes', () => {
  it('http_client_request', async () => {
    const postTokenRequest = rpcRequestForEvent(httpClientRequests[0])!;
    expect(postTokenRequest.requestHeaders['Authorization']).toEqual(
      `Bearer sk_test_tQGLxDke5HeZD6iTD1QyVZvV`
    );

    const schemes = new SecuritySchemes();
    schemes.addRpcRequest(postTokenRequest);
    expect(schemes.openapi()).toEqual({ bearer: { scheme: 'bearer', type: 'http' } });
  });
  // TODO: http_server_request
});

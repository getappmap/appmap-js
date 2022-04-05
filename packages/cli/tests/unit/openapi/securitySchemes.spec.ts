import { rpcRequestForEvent } from '../../../src/openapi/rpcRequest';
import SecuritySchemes from '../../../src/openapi/securitySchemes';
import { httpClientRequests, httpServerRequests } from './util';

describe('openapi.securitySchemes', () => {
  it('http_client_request', async () => {
    const request = rpcRequestForEvent(httpClientRequests[0])!;
    expect(request.requestHeaders['Authorization']).toEqual(
      `Bearer sk_test_tQGLxDke5HeZD6iTD1QyVZvV`
    );

    const schemes = new SecuritySchemes();
    schemes.addRpcRequest(request);
    expect(schemes.openapi()).toEqual({
      bearer: { scheme: 'bearer', type: 'http' },
    });
  });
  it('http_server_request', async () => {
    const request = rpcRequestForEvent(httpServerRequests[0])!;
    expect(request.requestHeaders['Authorization']).toEqual(
      `Bearer YWRtaW46MDU0YjVhOTYtODAwYi00NTY2LTkwZjQtMDAzMThhMjUwYTAz`
    );

    const schemes = new SecuritySchemes();
    schemes.addRpcRequest(request);
    expect(schemes.openapi()).toEqual({
      bearer: { scheme: 'bearer', type: 'http' },
    });
  });
});

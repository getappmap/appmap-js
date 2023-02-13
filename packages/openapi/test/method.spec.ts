import { OpenAPIV3 } from 'openapi-types';
import Method from '../src/method';

describe('Method', () => {
  function buildMethod(method: OpenAPIV3.HttpMethods) {
    const m = new Method();
    m.addRpcRequest({
      status: 200,
      requestMethod: method,
      requestHeaders: {
        'Content-Type': 'application/json',
      },
      requestContentType: 'application/json',
      responseHeaders: {},
      parameters: [
        {
          name: 'data',
          value: '{}',
          class: 'String',
        },
      ],
      requestPath: '/foo',
    });
    return m;
  }

  it('ignores `requestBody` for methods with no defined semantics for request messages', () => {
    [OpenAPIV3.HttpMethods.GET, OpenAPIV3.HttpMethods.HEAD, OpenAPIV3.HttpMethods.DELETE].forEach(
      (method) => {
        expect(buildMethod(method).openapi().requestBody).toBeUndefined();
      }
    );
  });

  it('provides `requestBody` for methods with defined semantics for request messages', () => {
    [
      OpenAPIV3.HttpMethods.OPTIONS,
      OpenAPIV3.HttpMethods.POST,
      OpenAPIV3.HttpMethods.PUT,
      OpenAPIV3.HttpMethods.PATCH,
    ].forEach((method) => {
      expect(buildMethod(method).openapi().requestBody).toBeDefined();
    });
  });
});

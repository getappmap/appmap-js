import { OpenAPIV3 } from 'openapi-types';
import Method from '../src/method';
import { RPCRequest } from '../src/rpcRequest';

describe('Method', () => {
  describe('requestBody', () => {
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

    describe('for methods with no defined semantics for request messages', () => {
      it('is ignored', () => {
        [
          OpenAPIV3.HttpMethods.GET,
          OpenAPIV3.HttpMethods.HEAD,
          OpenAPIV3.HttpMethods.DELETE,
        ].forEach((method) => {
          expect(buildMethod(method).openapi().requestBody).toBeUndefined();
        });
      });
    });

    describe('for methods with defined semantics for request messages', () => {
      it('is provided', () => {
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
  });

  describe('status code', () => {
    const emptyResponse = {
      responses: {},
    };

    let request: RPCRequest;

    beforeEach(() => {
      request = {
        requestMethod: OpenAPIV3.HttpMethods.GET,
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
      } as any as RPCRequest;
    });

    function openapi() {
      const m = new Method();
      m.addRpcRequest(request);
      return m.openapi();
    }

    describe('when missing', () => {
      it('the request is ignored', () => {
        expect(Object.keys(request)).not.toContain('status');
        expect(openapi()).toEqual(emptyResponse);
      });
    });
    describe('when undefined', () => {
      it('the request is ignored', () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        (request as any).status = undefined;
        expect(openapi()).toEqual(emptyResponse);
      });
    });
    describe('when invalid', () => {
      it('the request is ignored', () => {
        request.status = -1;
        expect(openapi()).toEqual(emptyResponse);
      });
    });
  });
});

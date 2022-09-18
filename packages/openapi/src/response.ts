import StatusCodes from './statusCodes';
import { OpenAPIV3 } from 'openapi-types';
import { RPCRequest } from './rpcRequest';
import SchemaInferrer from './schemaInferrer';

export default class Response {
  rpcRequests: RPCRequest[] = [];

  constructor(public statusCode: number) {}

  openapi(): OpenAPIV3.ResponseObject {
    // eslint-disable-next-line arrow-body-style
    const contentTypes = () => {
      return this.rpcRequests
        .map((rpcRequest) => rpcRequest.responseContentType)
        .filter((ct): ct is string => !!ct)
        .map((ct) => ct.split(';')[0]);
    };

    const schemata: Record<string, SchemaInferrer> = {};

    this.rpcRequests.forEach((rpcRequest) => {
      const returnValue = rpcRequest.returnValue;
      if (!returnValue) return;

      if (rpcRequest.responseContentType) {
        const mimeType = rpcRequest.responseContentType.split(';')[0];
        if (!schemata[mimeType]) {
          schemata[mimeType] = new SchemaInferrer();
        }
        schemata[mimeType].addExample(returnValue);
      }
    });

    const content = [...new Set(contentTypes())].sort().reduce((memo, mimeType) => {
      memo[mimeType] = {};

      if (!schemata[mimeType]) return memo;

      // eslint-disable-next-line no-param-reassign
      const schema = schemata[mimeType].openapi();
      if (schema) memo[mimeType].schema = schema;

      return memo;
    }, {} as Record<string, OpenAPIV3.MediaTypeObject>);
    return { content, description: StatusCodes[this.statusCode] };
  }

  addRpcRequest(rpcRequest: RPCRequest): void {
    this.rpcRequests.push(rpcRequest);
  }
}

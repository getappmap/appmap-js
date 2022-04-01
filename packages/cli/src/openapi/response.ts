import StatusCodes from './statusCodes';
import { OpenAPIV3 } from 'openapi-types';
import { RPCRequest } from './rpcRequest';
import { messageToOpenAPISchema } from './util';

export default class Response {
  rpcRequests: RPCRequest[] = [];

  constructor(public statusCode: number) {}

  openapi(): OpenAPIV3.ResponseObject {
    // eslint-disable-next-line arrow-body-style
    const contentTypes = () => {
      return this.rpcRequests
        .map((rpcRequest) => rpcRequest.responseContentType)
        .filter((ct) => ct)
        .map((ct) => ct!.split(';')[0]);
    };

    const schemata: Record<string, OpenAPIV3.SchemaObject> = {};

    this.rpcRequests.forEach((rpcRequest) => {
      const returnValue = rpcRequest.returnValue;
      if (!returnValue) return;

      if (rpcRequest.responseContentType) {
        const mimeType = rpcRequest.responseContentType!.split(';')[0];
        if (!schemata[mimeType]) {
          // TODO: Merge these instead of overwriting
          schemata[mimeType] = messageToOpenAPISchema(returnValue);
        }
      }
    });

    const content = [...new Set(contentTypes())]
      .sort()
      .reduce((memo, mimeType) => {
        // eslint-disable-next-line no-param-reassign
        memo[mimeType] = {};
        const schema = schemata[mimeType];
        if (schema) {
          memo[mimeType].schema = schema;
        }
        return memo;
      }, {} as Record<string, OpenAPIV3.MediaTypeObject>);
    return { content, description: StatusCodes[this.statusCode] };
  }

  addRpcRequest(rpcRequest: RPCRequest): void {
    this.rpcRequests.push(rpcRequest);
  }
}

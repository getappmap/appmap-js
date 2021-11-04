import StatusCodes from './statusCodes';
import { OpenAPIV3 } from 'openapi-types';
import { RPCRequest } from './rpcRequest';

export default class Response {
  rpcRequests: RPCRequest[] = [];

  constructor(public statusCode: number) {}

  openapi(): OpenAPIV3.ResponseObject {
    // eslint-disable-next-line arrow-body-style
    const contentTypes = () => {
      return this.rpcRequests
        .map((rpcRequest) => rpcRequest.contentType)
        .filter((ct) => ct)
        .map((ct) => ct!.split(';')[0]);
    };
    const content = [...new Set(contentTypes())].sort().reduce((memo, mimeType) => {
      // eslint-disable-next-line no-param-reassign
      memo[mimeType] = {};
      return memo;
    }, {} as Record<string, OpenAPIV3.MediaTypeObject>);
    return { content, description: StatusCodes[this.statusCode] };
  }

  addRpcRequest(rpcRequest: RPCRequest): void {
    this.rpcRequests.push(rpcRequest);
  }
}

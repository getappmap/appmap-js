import { OpenAPIV3 } from 'openapi-types';
import Method from './method';
import { RPCRequest } from './rpcRequest';

export default class Path {
  methods: Record<string, Method> = {};

  openapi(): Record<OpenAPIV3.HttpMethods, OpenAPIV3.OperationObject> {
    return Object.keys(this.methods)
      .sort()
      .reduce((memo, method: string) => {
        // eslint-disable-next-line no-param-reassign
        memo[method as OpenAPIV3.HttpMethods] =
          this.methods[method as OpenAPIV3.HttpMethods].openapi();
        return memo;
      }, {} as Record<OpenAPIV3.HttpMethods, OpenAPIV3.OperationObject>);
  }

  addRpcRequest(rpcRequest: RPCRequest): void {
    const method = rpcRequest.requestMethod;
    if (!method) {
      return;
    }

    if (!this.methods[method]) {
      this.methods[method] = new Method();
    }
    const methodObj = this.methods[method];
    methodObj.addRpcRequest(rpcRequest);
  }
}

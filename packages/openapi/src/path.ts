import { OpenAPIV3 } from 'openapi-types';
import Method from './method';
import { RPCRequest } from './rpcRequest';

export default class Path {
  methods: Record<string, Method> = {};

  openapi(): OpenAPIV3.PathItemObject {
    return Object.keys(this.methods)
      .sort()
      .reduce((memo, methodName: string) => {
        const method = this.methods[methodName as OpenAPIV3.HttpMethods];
        // eslint-disable-next-line no-param-reassign
        memo[methodName as OpenAPIV3.HttpMethods] = method.openapi();
        return memo;
      }, {} as Record<OpenAPIV3.HttpMethods, OpenAPIV3.OperationObject>) as OpenAPIV3.PathItemObject;
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

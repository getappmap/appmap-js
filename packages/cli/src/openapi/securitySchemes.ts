import { OpenAPIV3 } from 'openapi-types';
import { RPCRequest } from './rpcRequest';
import { parseScheme } from './util';

export default class SecuritySchemes {
  rpcRequests: RPCRequest[] = [];

  /**
   * Adds an event to the security schemes, and assigns a security scheme id.
   * If the event has no detectable security scheme, this function returns null.
   *
   * @returns the security scheme id for the event, or null.
   */
  addRpcRequest(rpcRequest: RPCRequest): void {
    this.rpcRequests.push(rpcRequest);
  }

  openapi(): Record<string, OpenAPIV3.SecuritySchemeObject> {
    return this.rpcRequests
      .map((rpcRequest) => rpcRequest.requestHeaders['Authorization'])
      .filter((authorization) => authorization)
      .reduce((memo, authorization) => {
        const scheme = parseScheme(authorization);
        if (!memo[scheme.schemeId]) {
          memo[scheme.schemeId] = scheme.scheme;
        }
        return memo;
      }, {} as Record<string, OpenAPIV3.SecuritySchemeObject>);
  }
}

import Model from './model';
import SecuritySchemes from './securitySchemes';
import { headerValue, rpcRequestForEvent } from './rpcRequest';
import { Event } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
export { default as parseHTTPServerRequests } from './parseHTTPServerRequests';
export { classNameToOpenAPIType, verbose } from './util';

interface OpenAPIV3Fragment {
  paths: OpenAPIV3.PathItemObject;
  securitySchemes: Record<string, OpenAPIV3.SecuritySchemeObject>;
}

const forClientRequest = (event: Event): OpenAPIV3Fragment | undefined => {
  const rpcRequest = rpcRequestForEvent(event);
  if (!rpcRequest) {
    return;
  }

  const securitySchemes = new SecuritySchemes();
  const model = new Model();
  if (rpcRequest.requestHeaders) {
    const authorizationHeader = headerValue(rpcRequest.requestHeaders, 'authorization');
    if (authorizationHeader) securitySchemes.addAuthorizationHeader(authorizationHeader);
  }
  model.addRpcRequest(rpcRequest);

  return { paths: model.openapi(), securitySchemes: securitySchemes.openapi() };
};

export { Model, forClientRequest, rpcRequestForEvent, SecuritySchemes };

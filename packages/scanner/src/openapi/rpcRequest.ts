import { Event, ParameterObject } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { URL } from 'url';
import { ensureString } from './util';

export interface RPCRequest {
  status: number;
  parameters: readonly ParameterObject[];
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  contentType: string;
  requestMethod: OpenAPIV3.HttpMethods;
  requestPath: string;
}

class ServerRPCRequest implements RPCRequest {
  constructor(private event: Event) {}

  get status() {
    return this.event.httpServerResponse!.status;
  }

  get parameters() {
    return this.event.parameters || [];
  }

  get requestHeaders() {
    return this.event.httpServerRequest?.headers || {};
  }

  get responseHeaders() {
    return this.event.httpServerResponse?.headers || {};
  }

  get contentType() {
    return (this.event.httpServerResponse!.headers || {})['Content-Type'];
  }

  get requestMethod() {
    return this.event.httpServerRequest!.request_method.toLowerCase() as OpenAPIV3.HttpMethods;
  }

  get requestPath() {
    return ensureString(
      this.event.httpServerRequest!.normalized_path_info || this.event.httpServerRequest!.path_info
    );
  }
}

class ClientRPCRequest implements RPCRequest {
  constructor(private event: Event) {}

  get status() {
    return this.event.httpClientResponse!.status;
  }

  get parameters() {
    return this.event.parameters || [];
  }

  get requestHeaders() {
    return this.event.httpClientRequest?.headers || {};
  }

  get responseHeaders() {
    return this.event.httpClientResponse?.headers || {};
  }

  get contentType() {
    return (this.event.httpClientResponse!.headers || {})['Content-Type'];
  }

  get requestMethod() {
    return this.event.httpClientRequest!.request_method.toLowerCase() as OpenAPIV3.HttpMethods;
  }

  get requestPath() {
    // TODO: Back-substitute query parameters into the URL.
    return new URL(this.event.httpClientRequest!.url).pathname;
  }
}

export function rpcRequestForEvent(event: Event): RPCRequest | undefined {
  if (event.httpServerRequest && event.httpServerResponse) {
    return new ServerRPCRequest(event);
  } else if (event.httpClientRequest && event.httpClientResponse) {
    return new ClientRPCRequest(event);
  }
}

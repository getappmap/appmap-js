import { Event, ParameterObject, ReturnValueObject } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { URL } from 'url';
import { ensureString } from './util';

export interface RPCRequest {
  status: number;
  parameters: readonly ParameterObject[];
  returnValue?: ReturnValueObject;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestContentType?: string;
  responseContentType?: string;
  requestMethod: OpenAPIV3.HttpMethods;
  requestPath: string;
}

type ServerRpcEvent = Event & Required<Pick<Event, 'httpServerRequest' | 'httpServerResponse'>>;
type ClientRpcEvent = Event & Required<Pick<Event, 'httpClientRequest' | 'httpClientResponse'>>;

class ServerRPCRequest implements RPCRequest {
  constructor(private event: ServerRpcEvent) { }

  get status() {
    return this.event.httpServerResponse.status;
  }

  get parameters() {
    return this.event.message || [];
  }

  get returnValue() {
    return this.event.returnValue;
  }

  get requestHeaders() {
    return this.event.httpServerRequest?.headers || {};
  }

  get responseHeaders() {
    return this.event.httpServerResponse?.headers || {};
  }

  get requestContentType() {
    return this.event.requestContentType;
  }

  get responseContentType() {
    return this.event.responseContentType;
  }

  get requestMethod() {
    return this.event.requestMethod?.toLowerCase() as OpenAPIV3.HttpMethods;
  }

  get requestPath() {
    return ensureString(
      this.event.httpServerRequest.normalized_path_info ||
        this.event.httpServerRequest.path_info
    );
  }
}

class ClientRPCRequest implements RPCRequest {
  constructor(private event: ClientRpcEvent) {}

  get status() {
    return this.event.httpClientResponse.status;
  }

  get parameters() {
    return this.event.parameters || [];
  }

  get returnValue() {
    return this.event.returnValue;
  }

  get requestHeaders() {
    return this.event.httpClientRequest?.headers || {};
  }

  get responseHeaders() {
    return this.event.httpClientResponse?.headers || {};
  }

  get requestContentType() {
    return this.event.requestContentType;
  }

  get responseContentType() {
    return this.event.responseContentType;
  }

  get requestMethod() {
    return this.event.requestMethod?.toLowerCase() as OpenAPIV3.HttpMethods;
  }

  get requestPath() {
    // TODO: Back-substitute query parameters into the URL.
    return new URL(this.event.httpClientRequest.url).pathname;
  }
}

function isServerEvent(event: Event): event is ServerRpcEvent {
  return !!event.httpServerRequest && !!event.httpServerResponse;
}

function isClientEvent(event: Event): event is ClientRpcEvent {
  return !!event.httpClientRequest && !!event.httpClientResponse;
}

export function rpcRequestForEvent(event: Event): RPCRequest | undefined {
  if (isServerEvent(event)) return new ServerRPCRequest(event);
  if (isClientEvent(event)) return new ClientRPCRequest(event);
}

import { request as httpRequest, ClientRequest, RequestOptions, IncomingMessage } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import loadConfiguration from './loadConfiguration';
import { ServiceEndpoint, getServiceUrl } from './configuration';

export type Request = {
  requestFunction: (
    url: string | URL,
    options: RequestOptions,
    callback?: (response: IncomingMessage) => void
  ) => ClientRequest;
  url: URL;
  headers: Record<string, string>;
};

export interface BuildRequestOptions {
  readonly requireApiKey?: boolean;
  readonly service?: ServiceEndpoint;
}

export default function buildRequest(
  requestPath: string,
  options: BuildRequestOptions = {}
): Request {
  const configuration = loadConfiguration(options.requireApiKey);
  const serviceUrl = getServiceUrl(configuration, options.service || ServiceEndpoint.AppLandApi);
  const url = new URL(requestPath, serviceUrl);
  const requestFunction = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (configuration.apiKey) {
    headers.authorization = `Bearer ${configuration.apiKey}`;
  }

  return { requestFunction, url, headers };
}

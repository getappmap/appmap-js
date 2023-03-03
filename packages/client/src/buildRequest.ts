import { request as httpRequest, ClientRequest, RequestOptions, IncomingMessage } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import loadConfiguration from './loadConfiguration';

export type Request = {
  requestFunction: (
    url: string | URL,
    options: RequestOptions,
    callback?: (response: IncomingMessage) => void
  ) => ClientRequest;
  url: URL;
  headers: Record<string, string>;
};

export default function buildRequest(requestPath: string, requireApiKey = true): Request {
  const configuration = loadConfiguration(requireApiKey);
  const url = new URL([configuration.baseURL, requestPath].join('/'));
  const requestFunction = url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {
    Accept: 'application/json',
  };
  if (configuration.apiKey) {
    // eslint-disable-next-line @typescript-eslint/dot-notation
    headers['Authorization'] = `Bearer ${configuration.apiKey}`;
  }

  return { requestFunction, url, headers };
}

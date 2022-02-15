import {
  request as httpRequest,
  ClientRequest,
  RequestOptions,
  IncomingMessage,
} from 'http';
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

export default async function buildRequest(
  requestPath: string
): Promise<Request> {
  const configuration = await loadConfiguration();
  const url = new URL([configuration.baseURL, requestPath].join('/'));
  const requestFunction =
    url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {
    Authorization: `Bearer ${configuration.apiKey}`,
    Accept: 'application/json',
  };

  return { requestFunction, url, headers } as Request;
}

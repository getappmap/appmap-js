import {
  request as httpRequest,
  ClientRequest,
  RequestOptions,
  IncomingMessage,
} from 'node:http';
import { request as httpsRequest } from 'node:https';
import loadConfiguration from './loadConfiguration';

type Request = {
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
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const url = new URL([configuration.baseURL, requestPath].join('/'));
  const requestFunction =
    url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Authorization: `Bearer ${configuration.apiKey}`,
    Accept: 'application/json',
  };

  return { requestFunction, url, headers } as Request;
}

import {
  request as httpRequest,
  ClientRequest,
  RequestOptions,
  IncomingMessage,
} from 'node:http';
import { request as httpsRequest } from 'node:https';
import Settings from './settings';

type Request = {
  requestFunction: (
    url: string | URL,
    options: RequestOptions,
    callback?: (response: IncomingMessage) => void
  ) => ClientRequest;
  headers: Record<string, string>;
};

export default function buildRequest() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const url = new URL(Settings.baseURL!);
  const requestFunction =
    url.protocol === 'https:' ? httpsRequest : httpRequest;
  const headers = {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    Authorization: `Bearer ${Settings.apiKey!}`,
    Accept: 'application/json',
  };

  return { requestFunction, headers } as Request;
}

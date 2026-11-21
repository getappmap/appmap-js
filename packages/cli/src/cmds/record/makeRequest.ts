import { isNativeError } from 'util/types';
import type RemoteRecording from './remoteRecording';

export class RemoteRecordingError extends Error {
  constructor(
    public description: string,
    public statusCode: number,
    public method: string,
    public path: string,
    msg: string
  ) {
    super(msg);
  }

  toString(): string {
    return `description: ${this.description}
status: ${this.statusCode}
response text: ${this.message}`;
  }
}

export default async function makeRequest(
  rr: RemoteRecording,
  path: string,
  method: string,
  description: string,
  statusCodes: number[] = [200, 201, 204]
): Promise<any> {
  const { hostname: host, protocol, port } = rr.requestOptions;
  const url = `${protocol}//${host}:${port}${path}`;
  let response: Response;
  try {
    response = await fetch(url, { method });
  } catch (e) {
    // fetch reports network failures as a bare "fetch failed" TypeError;
    // the cause carries the useful part, e.g. "connect ECONNREFUSED ...".
    // isNativeError rather than instanceof, since under jest the error comes
    // from another realm.
    const cause = isNativeError(e) ? e.cause : undefined;
    if (!isNativeError(cause)) throw e;
    // Connecting to "localhost" tries both ::1 and 127.0.0.1, and failing
    // both yields an AggregateError with an empty message.
    if (!cause.message && 'errors' in cause && Array.isArray(cause.errors))
      cause.message = cause.errors.map((err: Error) => err.message).join('; ');
    throw cause;
  }

  const statusCode = response.status;
  const data = await response.text();

  if (statusCodes.includes(statusCode)) {
    return { statusCode, data };
  } else {
    throw new RemoteRecordingError(description, statusCode, method, path, data);
  }
}

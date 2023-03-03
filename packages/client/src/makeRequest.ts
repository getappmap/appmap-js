import { IncomingHttpHeaders } from 'http';
import buildRequest from './buildRequest';
import { RetryOptions } from './retryOptions';

export const RetryCondition = Object.freeze({
  Timeout(_response?: Response, error?: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const { code } = error as { code: string };
      return ['ETIMEDOUT', 'EPIPE', 'ECONNRESET'].includes(code);
    }
    return false;
  },
  Status5xx(response?: Response) {
    return response?.statusCode && response.statusCode >= 500;
  },
});

export interface Response {
  readonly statusCode: number;
  readonly headers: IncomingHttpHeaders;
  readonly body: Buffer;
  readonly ok: boolean;
}

export interface RequestOptions {
  readonly path: string;
  readonly method?: string;
  readonly query?: ReadonlyArray<[string, string]>;
  readonly body?: string | Buffer | Uint8Array | Record<string, unknown>;
  readonly headers?: Record<string, string>;
  readonly authenticate?: boolean;
  readonly retry?:
    | (RetryOptions & {
        readonly description: string;
      })
    | false;
}

function withDefaultOptions(options: RequestOptions): RequestOptions {
  return {
    method: 'GET',
    authenticate: true,
    retry: {
      description: options.path,
      maxRetries: 3,
      retryDelay: 500,
    },
    ...options,
  };
}

function shouldRetry(response?: Response, error?: unknown): boolean {
  return Object.values(RetryCondition).some((condition) => condition(response, error));
}

function performRequest(options: RequestOptions): Promise<Response> {
  const requestOptions = withDefaultOptions(options);

  let query = '';
  if (requestOptions.query) {
    const searchParameters = new URLSearchParams();
    requestOptions.query.forEach(([key, value]) => searchParameters.append(key, value));
    query = `?${searchParameters.toString()}`;
  }

  const requestBuilder = buildRequest(requestOptions.path + query, requestOptions.authenticate);
  return new Promise((resolve, reject) => {
    let bodyContent = '';
    const additionalHeaders = {};
    if (requestOptions.body) {
      const { body } = requestOptions;
      const isUint8Array = body instanceof Uint8Array;
      const isBuffer = body instanceof Buffer;
      const isObject = typeof body === 'object';

      /* eslint-disable-next-line unicorn/prefer-ternary */
      if (isObject && !isUint8Array && !isBuffer) {
        bodyContent = JSON.stringify(body);
      } else {
        bodyContent = body.toString('utf-8');
      }
    }

    if (bodyContent) {
      additionalHeaders['Content-Length'] = Buffer.byteLength(bodyContent, 'utf-8').toString();
      additionalHeaders['Content-Type'] = 'application/json';
    }

    const request = requestBuilder.requestFunction(
      requestBuilder.url,
      {
        headers: { ...additionalHeaders, ...requestOptions.headers },
        method: requestOptions.method,
      },
      (response) => {
        let buf = '';
        response.on('data', (chunk) => {
          buf += chunk;
        });
        response.on('end', () => {
          if (!response.statusCode) return reject(new Error('No status code'));
          return resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: Buffer.from(buf),
            ok: response.statusCode >= 200 && response.statusCode < 300,
          });
        });
      }
    );

    if (bodyContent) request.write(bodyContent, 'utf-8');

    request.on('error', (error) => {
      reject(error);
    });

    request.end();
  });
}

export default async function makeRequest(options: RequestOptions): Promise<Response> {
  const requestOptions = withDefaultOptions(options);

  let maxAttempts = 1;
  if (requestOptions.retry) {
    maxAttempts = (requestOptions.retry.maxRetries || 0) + 1;
  }

  let numberAttempts = 0;
  /* eslint-disable no-await-in-loop */
  for (;;) {
    let response: Response | undefined;
    let error: unknown;

    try {
      response = await performRequest(options);
    } catch (error_: unknown) {
      error = error_;
    }

    numberAttempts += 1;

    if (!shouldRetry(response, error) || numberAttempts >= maxAttempts || !requestOptions.retry) {
      if (response) return response;
      throw error;
    }

    const nextAttempt = (requestOptions.retry.retryDelay || 500) * 2 ** (numberAttempts - 1);
    await new Promise((resolve) => {
      setTimeout(resolve, nextAttempt);
    });
  }
  /* eslint-enable no-await-in-loop */
}

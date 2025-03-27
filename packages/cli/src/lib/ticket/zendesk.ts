import assert from 'node:assert';

import stripAnsi from 'strip-ansi';

import { HttpError } from '../../cmds/errors';

export const APPMAP_SUPPORT_URL = process.env.APPMAP_SUPPORT_URL ?? 'https://appland.zendesk.com';

// debugAdapter simulates a fetch call when process.env.APPMAP_ZENDESK_DEBUG is "true"
// It prints out the details of the outbound request, but doesn't actually send it
// eslint-disable-next-line @typescript-eslint/require-await
const debugFetch = async (url: string, options: RequestInit): Promise<Response> => {
  console.log(`URL: ${url}`);
  console.log(`Method: ${options.method}`);
  console.log(`Headers: ${JSON.stringify(options.headers)}`);
  if (options.body) {
    console.log(`Body: ${String(options.body)}`);
  }

  // Simulate a successful response
  const mockResponse = {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    // eslint-disable-next-line @typescript-eslint/require-await
    json: async () => ({ request: { id: '<zendesk request id>' } }),
    // eslint-disable-next-line @typescript-eslint/require-await
    text: async () => '{"request": {"id": "<zendesk request id>"}}',
  } as Response;

  return mockResponse;
};

export default async function createRequest(
  errors: string | string[],
  name: string,
  email: string,
  baseURL?: string
): Promise<number> {
  // eslint-disable-next-line no-param-reassign
  errors = !Array.isArray(errors) ? [errors] : errors;
  const requestBody = {
    request: {
      comment: {
        body: `Messages:
${errors.map((e) => `===\n${stripAnsi(e)}\n===`).join('\n')}`,
      },
      subject: `CLI command failure`,
      requester: {
        name,
        email,
      },
    },
  };

  try {
    const url = `${baseURL ?? APPMAP_SUPPORT_URL}/api/v2/requests.json`;
    const headers: HeadersInit = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    // Authorization is not required to create a Zendesk request. Without it, though, the API
    // endpoint is limited to 5 requests per hour, which is a nuisance when doing development.
    //
    // Per https://developer.zendesk.com/api-reference/ticketing/introduction/#api-token, the format
    // for ZENDESK_AUTHZ is {email_address}:{api_token}
    const zendeskAuthz = process.env.ZENDESK_AUTHZ;
    if (zendeskAuthz) {
      headers.Authorization = `Basic ${Buffer.from(zendeskAuthz).toString('base64')}`;
    }

    const fetchFn = process.env.APPMAP_ZENDESK_DEBUG ? debugFetch : fetch;
    const response = await fetchFn(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const responseData = await response.text();
      throw new HttpError('Failed to create a Zendesk Request', {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        toString: () =>
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers.entries()),
              data: responseData,
            },
            null,
            2
          ),
      });
    }

    const data = (await response.json()) as unknown;
    assert(
      data &&
        typeof data === 'object' &&
        'request' in data &&
        data.request &&
        typeof data.request === 'object' &&
        'id' in data.request &&
        typeof data.request.id === 'number'
    );
    return data.request.id;
  } catch (e) {
    // If it's already an HttpError from our error handling above, just rethrow it
    if (e instanceof HttpError) {
      throw e;
    }

    // Otherwise, it's likely a network error or something unexpected
    const msg = 'Failed to create a Zendesk Request';
    throw new HttpError(`${msg}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

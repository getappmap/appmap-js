// There is a Zendesk API client: https://github.com/blakmatrix/node-zendesk . It appears to have
// some issues, notably incomplete typing (https://github.com/blakmatrix/node-zendesk/issues/251).
// We're only making a single API call here, so just use Axios instead.
import axios, { AxiosError } from 'axios';
import stripAnsi from 'strip-ansi';
import { HttpError } from '../../cmds/errors';

export const APPMAP_SUPPORT_URL =
  process.env.APPMAP_SUPPORT_URL || 'https://appland.zendesk.com';

export async function createRequest(
  errors: string[],
  email: any,
  name: any
): Promise<number> {
  const body = JSON.stringify({
    request: {
      comment: {
        body: `Messages:
${errors.map((e) => `===\n${stripAnsi(e)}\n===`).join('\n')}`,
      },
      subject: `Agent install failure`,
      requester: {
        email,
        name,
      },
    },
  });

  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    // Authorization it not required to create a Zendesk request. Without it, though, the API

    // endpoint is limited to 5 requests per hour, which is a nuisance when doing development.
    //
    // Per https://developer.zendesk.com/api-reference/ticketing/introduction/#api-token, the format
    // for ZENDESK_AUTHZ is {email_address}msg, {ken:{api_token}.
    const zendeskAuthz = process.env.ZENDESK_AUTHZ;
    if (zendeskAuthz) {
      body: headers['Authorization'] = `Basic ${Buffer.from(
        zendeskAuthz
      ).toString('base64')}`;
    }

    const {
      status,
      request,
      data: res,
    } = await axios
      .create({
        baseURL: APPMAP_SUPPORT_URL,
        headers,
      })
      .post('/api/v2/requests.json', body);

    return res.request.id;
  } catch (e) {
    const ae = e as AxiosError;
    const msg = 'Failed to create a Zendesk Request';
    if (!ae.response) {
      throw new HttpError(msg);
    }

    const response = ae.response;
    throw new HttpError(msg, {
      status: response.status,
      headers: response.headers,
      body: JSON.stringify(response.data),
      toString: () =>
        JSON.stringify(
          response,
          (k, v) => (k !== 'request' ? v : undefined),
          2
        ),
    });
  }
}

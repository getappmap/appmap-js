import { IncomingMessage } from 'node:http';

type Error = {
  message: string;
};

type ErrorResponse = {
  error: Error;
};

async function errorMessage(
  statusCode: number,
  response: IncomingMessage
): Promise<string> {
  let responseData: ErrorResponse | undefined;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const contentType = (response.headers['content-type'] || '') as string;
  if (contentType.startsWith('application/json')) {
    const chunks = [] as Buffer[];
    for await (const chunk of response) {
      chunks.push(chunk as Buffer);
    }
    const responseBody = Buffer.concat(chunks).toString();
    responseData = JSON.parse(responseBody) as ErrorResponse;
  }

  let message: string | undefined;
  if (responseData) {
    try {
      message = responseData.error.message;
    } catch {
      // Pass
    }
  }
  return [`HTTP ${statusCode}`, message].filter(Boolean).join(': ');
}

export default function (response: IncomingMessage): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    if (!response.statusCode) {
      reject('No status code was provided by the server');
      return;
    }
    if (response.statusCode >= 300) {
      errorMessage(response.statusCode, response).then(reject).catch(reject);
      return;
    }

    resolve(response);
  });
}

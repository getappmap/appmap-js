const jaysonBrowserClient = require('jayson/lib/client/browser');
import { parseRpcUrl } from './RPCUrlUtils';

export function reportError(callback: any, err: any, error: any) {
  if (err) {
    if (callback) callback({ message: err.toString() });
  } else if (error) {
    if (error.code) {
      if (callback) callback(error);
    } else {
      const message = error.message || error.toString();
      if (callback) callback({ message: `An unexpected error occurred: ${message}` });
    }
  }
}

export function browserClient(urlOrPort: string | number) {
  const { httpUrl } = parseRpcUrl(urlOrPort);

  const callServer = function (request: any, callback: (err: Error | null, result?: any) => void) {
    const options = {
      method: 'POST',
      body: request,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    window
      .fetch(httpUrl, options)
      .then(function (res) {
        return res.text();
      })
      .then(function (text) {
        callback(null, text);
      })
      .catch(function (err) {
        callback(err);
      });
  };

  return new jaysonBrowserClient(callServer, {
    // other options go here
  });
}

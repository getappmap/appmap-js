const jaysonBrowserClient = require('jayson/lib/client/browser');

export function reportError(callback: any, err: any, error: any) {
  if (err) {
    if (callback) callback(err);
  } else if (error) {
    if (error.code && error.message) {
      if (callback) callback(new Error(`RPC error ${error.code}: ${error.message}`));
    } else {
      if (callback) callback(`Unknown error: ${error}`);
    }
  }
}

export function browserClient(port: number) {
  const callServer = function (request: any, callback: (err: Error | null, result?: any) => void) {
    const options = {
      method: 'POST',
      body: request,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    window
      .fetch(`http://localhost:${port}`, options)
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

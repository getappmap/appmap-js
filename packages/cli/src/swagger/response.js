const { STATUS_CODES } = require('http');

class Response {
  constructor(statusCode) {
    this.statusCode = parseInt(`${statusCode}`, 10);
    this.events = [];
  }

  swagger() {
    // eslint-disable-next-line arrow-body-style
    const mimeTypes = () => {
      return this.events
        .filter(
          (event) =>
            event.httpServerResponse && event.httpServerResponse.mime_type
        )
        .map((event) => event.httpServerResponse.mime_type.split(';')[0]);
    };
    const content = [...new Set(mimeTypes())]
      .sort()
      .reduce((memo, mimeType) => {
        // eslint-disable-next-line no-param-reassign
        memo[mimeType] = {};
        return memo;
      }, {});
    return { content, description: STATUS_CODES[this.statusCode] };
  }

  addRequest(event) {
    this.events.push(event);
  }
}

module.exports = Response;

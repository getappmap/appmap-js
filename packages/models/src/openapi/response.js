import StatusCodes from './statusCodes';
import { contentType } from '../util';

export default class Response {
  constructor(statusCode) {
    this.statusCode = parseInt(`${statusCode}`, 10);
    this.events = [];
  }

  openapi() {
    // eslint-disable-next-line arrow-body-style
    const contentTypes = () => {
      return this.events
        .map((event) => contentType(event))
        .filter((ct) => ct)
        .map((ct) => ct.split(';')[0]);
    };
    const content = [...new Set(contentTypes())]
      .sort()
      .reduce((memo, mimeType) => {
        // eslint-disable-next-line no-param-reassign
        memo[mimeType] = {};
        return memo;
      }, {});
    return { content, description: StatusCodes[this.statusCode] };
  }

  addRequest(event) {
    this.events.push(event);
  }
}

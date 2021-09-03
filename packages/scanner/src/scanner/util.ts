import { Event } from '@appland/models';

/*
const responseHeaders = (event: Event): any => {
  return event.httpServerResponse?.headers || event.httpClientResponse?.headers || {};
};
*/

// TODO: Why is mime_type still defined on httpServerResponse? It should be "headers".
function contentType(event: Event): string | undefined {
  return event.httpServerResponse?.mime_type;
  // responseHeaders(event)['Content-Type'] ||
}

// eslint-disable-next-line
function isFalsey(valueObj: any): boolean {
  if (!valueObj) {
    return true;
  }
  if (valueObj.class === 'FalseClass') {
    return true;
  }
  if (valueObj.class === 'Array' && valueObj.value === '[]') {
    return true;
  }
  if (valueObj.value === '') {
    return true;
  }

  return false;
}

export { contentType, isFalsey };

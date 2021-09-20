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

function appMapDir(appMapFileName: string): string {
  return appMapFileName.substring(0, appMapFileName.length - '.appmap.json'.length);
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

function ideLink(filePath: string, ide: string): string {
  const OSC = '\u001B]';
  const BEL = '\u0007';
  const SEP = ';';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const supportsHyperlinks = require('supports-hyperlinks');

  if (!supportsHyperlinks.stdout) {
    return filePath;
  }

  const path = `${__dirname}/../${filePath}`;
  const link = ide == 'vscode' ? 'vscode://file/' + path : `${ide}://open?file=${path}`;

  return [OSC, '8', SEP, SEP, link, BEL, filePath, OSC, '8', SEP, SEP, BEL].join('');
}

export { appMapDir, contentType, isFalsey, ideLink };

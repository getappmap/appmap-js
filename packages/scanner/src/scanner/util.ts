import { Event } from '@appland/models';

let isVerbose = false;
function verbose(v: boolean | null = null): boolean {
  if (v === true || v === false) {
    isVerbose = v;
  }
  return isVerbose;
}

function contentType(event: Event): string | undefined {
  if (event.httpServerResponse && event.httpServerResponse!.headers) {
    return event.httpServerResponse!.headers!['Content-Type'];
  }
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

function ideLink(filePath: string, ide: string, eventId: number): string {
  const OSC = '\u001B]';
  const BEL = '\u0007';
  const SEP = ';';

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const supportsHyperlinks = require('supports-hyperlinks');

  if (!supportsHyperlinks.stdout) {
    return filePath;
  }

  const path = `${__dirname}/../../../../../${filePath}`;
  const state = { currentView: 'viewFlow', selectedObject: `event:${eventId}` };
  const encodedState = encodeURIComponent(JSON.stringify(state));
  const link =
    ide == 'vscode'
      ? `vscode://appland.appmap/open?uri=${path}&state=${encodedState}`
      : `${ide}://open?file=${path}`;

  return [OSC, '8', SEP, SEP, link, BEL, filePath, OSC, '8', SEP, SEP, BEL].join('');
}

export { appMapDir, contentType, isFalsey, ideLink, verbose };

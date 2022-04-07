import { Event, ReturnValueObject } from '@appland/models';
import { isAbsolute } from 'path';

let isVerbose = false;
function verbose(v: boolean | null = null): boolean {
  if (v === true || v === false) {
    isVerbose = v;
  }
  return isVerbose;
}

function capitalize(str: string): string {
  if (!str || str === '') {
    return str;
  }
  return [str.charAt(0).toUpperCase(), str.slice(1)].join('');
}

function emptyValue(value: string): boolean {
  return [null, undefined, ''].includes(value);
}

function responseContentType(event: Event): string | undefined {
  if (event.httpServerResponse?.headers) {
    return event.httpServerResponse!.headers!['Content-Type'];
  } else if (event.httpClientResponse?.headers) {
    return event.httpClientResponse!.headers!['Content-Type'];
  }
}

function appMapDir(appMapFileName: string): string {
  return appMapFileName.substring(0, appMapFileName.length - '.appmap.json'.length);
}

// eslint-disable-next-line
function isFalsey(valueObj: ReturnValueObject): boolean {
  if (!valueObj) {
    return true;
  }
  if (valueObj.class === 'FalseClass') {
    return true;
  }
  if (valueObj.class === 'Array' && valueObj.value === '[]') {
    return true;
  }
  if (valueObj.class === 'Symbol' && valueObj.value === ':failure') {
    return true;
  }
  if (valueObj.value === '') {
    return true;
  }

  return false;
}

function isArray(valueObj: ReturnValueObject): boolean {
  return valueObj.class === 'Array';
}

function parseValue(valueObj: ReturnValueObject): string[] {
  if (isArray(valueObj) && valueObj.value.length > 2) {
    return valueObj.value
      .slice(1, valueObj.value.length - 1)
      .split(',')
      .map((v) => v.trim());
  }

  return [valueObj.value];
}

const isTruthy = (valueObj: ReturnValueObject): boolean => !isFalsey(valueObj);

function providesAuthentication(event: Event, label: string): boolean {
  return event.returnValue && event.labels.has(label) && isTruthy(event.returnValue);
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

  let path: string;
  if (!isAbsolute(filePath)) {
    path = `${__dirname}/../../../../../${filePath}`;
  } else {
    path = filePath;
  }
  const state = { currentView: 'viewFlow', selectedObject: `event:${eventId}` };
  const encodedState = encodeURIComponent(JSON.stringify(state));
  const link =
    ide == 'vscode'
      ? `vscode://appland.appmap/open?uri=${path}&state=${encodedState}`
      : `${ide}://open?file=${path}`;

  return [OSC, '8', SEP, SEP, link, BEL, filePath, OSC, '8', SEP, SEP, BEL].join('');
}

const toRegExp = (value: string | RegExp): RegExp => {
  return typeof value === 'string' ? new RegExp(value as string) : (value as RegExp);
};

const toRegExpArray = (value: string[] | RegExp[]): RegExp[] => {
  return value.map(toRegExp);
};

const RootLabels = ['command', 'job'];

const isRoot = (event: Event | undefined): boolean => {
  if (!event) {
    return true;
  }
  return (
    !!event.httpServerRequest || RootLabels.some((label) => event.codeObject.labels.has(label))
  );
};

// Attribution: https://github.com/shahata/dasherize
// MIT License
function dasherize(str: string): string {
  return str.replace(
    /[A-Z0-9](?:(?=[^A-Z0-9])|[A-Z0-9]*(?=[A-Z0-9][^A-Z0-9]|$))/g,
    function (s, i) {
      return (i > 0 ? '-' : '') + s.toLowerCase();
    }
  );
}

// Literally StackOverflow
function camelize(text: string): string {
  text = text.replace(/[-_\s.]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''));
  return text.slice(0, 1).toLowerCase() + text.slice(1);
}

function pluralize(word: string, count: number): string {
  return count === 1 ? word : [word, 's'].join('');
}

export {
  appMapDir,
  capitalize,
  emptyValue,
  isFalsey,
  isTruthy,
  ideLink,
  isRoot,
  parseValue,
  camelize,
  dasherize,
  pluralize,
  providesAuthentication,
  toRegExp,
  responseContentType,
  toRegExpArray,
  verbose,
};

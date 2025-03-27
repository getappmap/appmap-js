import { isAbsolute as isPosixAbsolute } from 'path/posix';
import { isAbsolute as isWindowsAbsolute } from 'path/win32';
import * as URI from 'uri-js';
import { v4 } from 'uuid';

export interface Range {
  start: number;
  end?: number;
}

export interface FileUriComponents {
  scheme: 'file';
  fsPath: string;
  range?: Range;
}

URI.SCHEMES.file = {
  scheme: 'file',
  unicodeSupport: true,
  parse(components: URI.URIComponents & FileUriComponents) {
    let filePath = components.path ?? '.';
    if (components.host) {
      filePath = `${components.host}:${filePath}`;
    }
    filePath = decodeURIComponent(filePath);

    const rangeMatch = components.fragment?.match(/^L(\d+)(?:-L(\d+))?$/);
    if (rangeMatch) {
      components.range = {
        start: parseInt(rangeMatch[1], 10),
      };
      if (rangeMatch[2]) {
        components.range.end = parseInt(rangeMatch[2], 10);
      }
    }

    components.fsPath = filePath;
    return components;
  },
  serialize(components: FileUriComponents): URI.URIComponents {
    let path = components.fsPath;
    if (components.range) {
      path += `:${components.range.start}`;
      if (components.range.end) {
        path += `-${components.range.end}`;
      }
    }
    return {
      scheme: 'file',
      path: encodeURIComponent(path),
    };
  },
};

function fromFilePath(path: string, range?: Range): string {
  let uri;
  if (isWindowsAbsolute(path)) {
    uri = `file:///${path.replace(/\\/g, '/')}`;
  } else if (isPosixAbsolute(path)) {
    uri = `file://${path}`;
  } else {
    uri = `file:${path}`;
  }
  if (range?.start) {
    uri += `#L${range.start}`;
    if (range.end) {
      uri += `-L${range.end}`;
    }
  }
  return uri;
}

function random(): string {
  return `urn:uuid:${v4()}`;
}

export default { ...URI, fromFilePath, random };

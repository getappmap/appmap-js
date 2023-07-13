/* eslint-disable class-methods-use-this */
import { AppMap, Event, ExceptionObject } from '@appland/models';
import Unique from './unique';

type CanonicalException = {
  class: string;
  message: string;
  location?: string;
  stack: string[];
};

function formatException(event: Event, exception: ExceptionObject): CanonicalException {
  const result: CanonicalException = {
    class: exception.class,
    message: exception.message,
    stack: [],
  };

  let { path, lineno } = exception;
  if (path) {
    result.location = [path, lineno].filter(Boolean).join(':');
    result.stack.push(result.location);
  }

  let ancestor: Event | undefined = event;
  while (ancestor) {
    if (ancestor.codeObject.location) {
      result.stack.push(ancestor.codeObject.location);
    }
    ancestor = ancestor.parent;
  }

  return result;
}

class Canonicalize extends Unique {
  functionCall(event: Event) {
    const { exceptions } = event;
    if (!exceptions || exceptions.length === 0) return;

    return exceptions.map((exception) => formatException(event, exception)).filter(Boolean);
  }
}

module.exports = (appmap: AppMap) => new Canonicalize(appmap).execute();

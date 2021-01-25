/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
import { EventNavigator } from '../models';
import { isFalsey } from '../util';
import { PROVIDER_AUTHENTICATION, PUBLIC } from './labels';
import ScanError from './scanError';

export class Authenticator {
  constructor(event) {
    this.event = event;
  }

  toString() {
    return `Authentication is provided by ${this.event.toString()}`;
  }
}

function providesAuthentication(event) {
  return (
    event.codeObject.labels?.has(PROVIDER_AUTHENTICATION) &&
    !isFalsey(event.returnValue)
  );
}

class Scope {
  constructor(event) {
    this.event = event;
  }

  /**
   * Finds the labeled authenticator within the scope.
   */
  *evaluate() {
    for (const event of this.event.descendants(providesAuthentication)) {
      yield new Authenticator(event.event);
    }
    yield new ScanError(
      `No authentication provider found in ${this.event.event.route}`,
      this.event.event,
    );
  }
}

function isAcceptedRoute(event) {
  if (!event.isCall()) {
    return false;
  }

  if (!event.httpServerRequest) {
    return false;
  }

  if (event.codeObject.labels?.has(PUBLIC)) {
    return false;
  }

  if (event.httpServerResponse.statusCode >= 300) {
    return false;
  }

  return true;
}

export class AuthenticationMissing {
  constructor(events) {
    this.events = events;
  }

  *scopes() {
    for (let index = 0; index < this.events.length; index += 1) {
      const evt = this.events[index];
      if (isAcceptedRoute(evt)) {
        yield new Scope(new EventNavigator(evt));
      }
    }
  }
}

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
    event.hasLabel(PROVIDER_AUTHENTICATION) && !isFalsey(event.returnValue)
  );
}

class Scope {
  constructor(event) {
    this.event = event;
  }

  /**
   * Finds the labeled authenticator within the scope.
   */
  evaulate() {
    for (const event of this.event.descendants(providesAuthentication)) {
      return new Authenticator(event);
    }
    return new ScanError(
      `No authentication provider found in ${this.event.route}`,
      this.event,
    );
  }
}

function isAcceptedRoute(event) {
  if (!event.httpServerRequest) {
    return false;
  }

  if (event.codeObject.labels.includes(PUBLIC)) {
    return false;
  }

  if (event.httpServerResponse.statusCode >= 300) {
    return false;
  }

  return true;
}

export class AuthenticationMissing {
  constructor(event) {
    this.event = new EventNavigator(event);
  }

  *scopes() {
    for (const scope of this.event.descendants(isAcceptedRoute)) {
      yield new Scope(scope);
    }
  }
}

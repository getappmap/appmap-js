/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
import { EventNavigator } from '../models';

export class Error {
  constructor(scope) {
    this.scope = scope;
  }

  toString() {
    return `No authentication provider found in ${this.scope.route}`;
  }
}

export class Authenticator {
  constructor(event) {
    this.event = event;
  }

  toString() {
    return `Authentication is provided by ${this.event.toString()}`;
  }
}

function providesAuthentication(event) {
  return event.hasLabel('provider.authentication');
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
    return null;
  }
}

function isAcceptedRoute(event) {
  if (!event.httpServerRequest) {
    return false;
  }

  if (event.codeObject.labels.includes('public')) {
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

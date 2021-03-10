/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
import { EventNavigator } from '../models';
import { isFalsey } from '../util';
import { PROVIDER_AUTHENTICATION, PUBLIC } from './labels';
import ScanError from './scanError';

export class Public {
  constructor(event) {
    this.event = event;
  }

  toString() {
    return `${this.event.toString()} is public`;
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

function isPublic(event) {
  return event.codeObject && event.codeObject.labels.has(PUBLIC);
}

function providesAuthentication(event) {
  return (
    event.codeObject &&
    event.codeObject.labels.has(PROVIDER_AUTHENTICATION) &&
    !isFalsey(event.returnValue)
  );
}

class Target {
  constructor(event) {
    this.event = event;
  }

  toString() {
    return this.event.toString();
  }

  /**
   * Finds the labeled authenticator within the scope.
   */
  // eslint-disable-next-line require-yield
  *evaluate() {
    const pub = this.event.descendants(isPublic).next();
    if (pub.value) {
      yield new Public(pub);
      return;
    }

    const authenticator = this.event.descendants(providesAuthentication).next();
    if (authenticator.value) {
      yield new Authenticator(authenticator.value.event);
      return;
    }
    yield new ScanError(
      `No authentication provider found in ${this.event.event.route}`,
      this.event.event
    );
  }
}

class Scope {
  constructor(event) {
    this.event = event;
  }

  toString() {
    return this.event.toString();
  }

  *targets() {
    yield new Target(this.event);
  }
}

function isAcceptedRoute(event) {
  if (!event.isCall()) {
    return false;
  }

  if (!event.httpServerRequest) {
    return false;
  }

  if (event.httpServerResponse && event.httpServerResponse.status >= 300) {
    return false;
  }

  return true;
}

/**
 * Ensures non-public routes have authentication.
 */
export class AuthenticationMissing {
  // eslint-disable-next-line class-methods-use-this
  toString() {
    return 'Authentication is required';
  }

  // eslint-disable-next-line class-methods-use-this
  *scopes(events) {
    for (let index = 0; index < events.length; index += 1) {
      const evt = events[index];
      if (isAcceptedRoute(evt)) {
        yield new Scope(new EventNavigator(evt));
      }
    }
  }
}

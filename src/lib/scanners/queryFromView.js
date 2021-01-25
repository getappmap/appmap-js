/* eslint-disable import/prefer-default-export */
/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */

import { EventNavigator } from '../models';
import { MVC_VIEW } from './labels';
import ScanError from './scanError';

class Target {
  *evaluate() {
    for (const event of this.event.descendants((evt) => evt.sql_query)) {
      yield new ScanError(
        `Query ${event.toString()} performed from view`,
        event,
      );
    }
  }
}

class Scope {
  constructor(event) {
    this.event = event;
  }

  /**
   * Finds the labeled mvc.view.
   */
  *targets() {
    for (const event of this.event.descendants((evt) =>
      evt.hasLabel(MVC_VIEW),
    )) {
      yield new Target(event);
    }
  }
}

export class QueryFromView {
  constructor(event) {
    this.event = new EventNavigator(event);
  }

  *scopes() {
    for (const scope of this.event.descendants(
      (evt) => evt.httpServerRequest,
    )) {
      yield new Scope(scope);
    }
  }
}

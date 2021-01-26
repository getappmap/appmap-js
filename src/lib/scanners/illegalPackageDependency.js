/* eslint-disable no-restricted-syntax */
/* eslint-disable max-classes-per-file */
/* eslint-disable import/prefer-default-export */

import { EventNavigator } from '../models';
import { isCommand } from '../util';

class Target {
  constructor(event, config) {
    this.event = event.event;
    this.config = config;
  }

  /**
   * Check and see if any of the inbound or outbound calls are from
   * a non-whitelisted package.
   */
  // eslint-disable-next-line require-yield
  *evaluate() {
    this.validateDependency(this.event.parent);
    if (this.event.children) {
      for (let index = 0; index < this.event.children.length; index += 1) {
        const child = this.event.children[index];
        this.validateDependency(child);
      }
    }
  }

  *validateDependency(event) {
    if (!this.config.allowedDependencies.include(event.packageName)) {
      yield event;
    }
  }
}

class Scope {
  constructor(event, config) {
    this.event = event;
    this.config = config;
  }

  *targets() {
    function packageName(event) {
      const { packageObject } = event.codeObject;
      if (packageObject) {
        return packageObject.name;
      }
      if (event.httpServerRequest) {
        return 'HTTP';
      }
      if (event.sqlQuery) {
        return 'SQL';
      }

      throw new Error(`Unknown package for ${event.toString()}`);
    }

    for (const descendant of this.event.descendants(
      (evt) => packageName(evt) === this.config.packageName,
    )) {
      yield new Target(descendant, this.config);
    }
  }
}

/**
 * Enforces a whitelist of package dependencies.
 */
export class IllegalPackageDependency {
  constructor(packageName, allowedDependencies) {
    this.packageName = packageName;
    this.allowedDependencies = allowedDependencies;
  }

  /**
   * Each top-level command event is a scope.
   */
  *scopes(events) {
    for (let index = 0; index < events.length; index += 1) {
      const evt = events[index];
      if (isCommand(evt)) {
        yield new Scope(new EventNavigator(evt), {
          packageName: this.packageName,
          allowedDependencies: this.allowedDependencies,
        });
      }
    }
  }
}

import { Event } from '@appland/models';
import { Scope } from './types';
import { AppMap } from '@appland/models';

export default class Assertion {
  public where?: (e: Event, appMap?: AppMap) => boolean;
  public description?: string;

  static assert(
    scope: Scope,
    assert: (e: Event, appMap: AppMap) => boolean,
    cb?: (assertion: Assertion) => void
  ): Assertion {
    const assertion = new Assertion(scope, assert);
    if (cb) {
      cb(assertion);
    }
    return assertion;
  }

  constructor(public scope: Scope, public assert: (e: Event, appMap: AppMap) => boolean) {}

  toString(): string {
    const tokens = [`[${this.scope}]`];
    if (this.description) {
      tokens.push(this.description);
    } else {
      tokens.push(this.assert.toString());
    }
    if (this.where) {
      tokens.push(`(where ${this.where})`);
    }
    return tokens.join(' ');
  }
}

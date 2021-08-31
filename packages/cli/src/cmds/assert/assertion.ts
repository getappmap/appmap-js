// @ts-ignore
import { Event } from '@appland/models';
import { Scope } from './types';
import { AppMapData } from '../../appland/types';

export default class Assertion {
  public where?: (e: Event, appMap?: AppMapData) => boolean;
  public description?: string;

  static assert(
    scope: Scope,
    assert: (e: Event, appMap: AppMapData) => Boolean,
    cb?: (assertion: Assertion) => void
  ) {
    const assertion = new Assertion(scope, assert);
    if (cb) {
      cb(assertion);
    }
    return assertion;
  }

  constructor(
    public scope: Scope,
    public assert: (e: Event, appMap: AppMapData) => Boolean
  ) {}

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

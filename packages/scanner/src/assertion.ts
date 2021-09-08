import { Event, AppMap } from '@appland/models';
import { Scope } from './types';

export default class Assertion {
  public where?: (e: Event, appMap: AppMap) => boolean;
  public include: ((e: Event, appMap: AppMap) => boolean)[];
  public exclude: ((e: Event, appMap: AppMap) => boolean)[];
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

  constructor(public scope: Scope, public assert: (e: Event, appMap: AppMap) => boolean) {
    this.include = [];
    this.exclude = [];
  }

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
    if (this.include.length > 0) {
      tokens.push(`(include ${this.include.join(' && ')})`);
    }
    if (this.exclude.length > 0) {
      tokens.push(`(exclude ${this.exclude.join(' || ')})`);
    }
    return tokens.join(' ');
  }
}

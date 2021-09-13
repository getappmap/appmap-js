import { EventFilter, Scope } from './types';

export default class Assertion {
  public where?: EventFilter;
  public include: EventFilter[];
  public exclude: EventFilter[];
  public description?: string;

  static assert(
    id: string,
    summaryTitle: string,
    scope: Scope,
    assert: EventFilter,
    cb?: (assertion: Assertion) => void
  ): Assertion {
    const assertion = new Assertion(id, summaryTitle, scope, assert);
    if (cb) {
      cb(assertion);
    }
    return assertion;
  }

  constructor(
    public id: string,
    public summaryTitle: string,
    public scope: Scope,
    public assert: EventFilter
  ) {
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

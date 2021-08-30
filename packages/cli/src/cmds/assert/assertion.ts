// @ts-ignore
import { Event } from '@appland/models';
import { Scope } from './types';
import { AppMapData } from '../../appland/types';

export default class Assertion {
  constructor(
    public scope: Scope,
    public assert: (e: Event, appMap: AppMapData) => Boolean,
    public where?: (e: Event, appMap: AppMapData) => Boolean,
  ) {}

  toString(): string {
    return `[${this.scope}] ${this.assert} ${this.where ? `(where ${this.where})` : ''}`
  }
}

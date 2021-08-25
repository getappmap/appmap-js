import { Scope } from './types';

export default class Assertion {
  constructor(public scope: Scope, public assert: string, public where?: string) {
  }
}

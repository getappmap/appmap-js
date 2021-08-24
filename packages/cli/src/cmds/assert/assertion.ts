import { Scope } from './types';

export default class Assertion {
  constructor(public scope: Scope, public where: string, public assert: string) {
  }
}

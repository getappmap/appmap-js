// @ts-ignore
import { Event } from '@appland/models';
import Assertion from "./assertion";

export default class AssertionsConfig {
  assertions: Assertion[];

  constructor() {
    this.assertions = [
      new Assertion('http_server_request',(e: Event) => e.elapsed < 1),
      new Assertion('sql_query', (e: Event) => e.elapsed < 1, (e: Event) => e.sql.sql.match(/SELECT/)),
    ];
  }
}

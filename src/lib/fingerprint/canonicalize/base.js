import { buildTree, notNull } from '../algorithms';

export default class {
  constructor(appmap) {
    this.appmap = appmap;
  }

  execute() {
    const events = this.appmap.events
      .filter((event) => event.isCall())
      .map(this.transform.bind(this))
      .filter(notNull);
    return buildTree(events);
  }

  transform(event) {
    if (event.sql) {
      return this.sql(event);
    }
    if (event.httpServerRequest) {
      return this.httpServerRequest(event);
    }

    return this.functionCall(event);
  }
}

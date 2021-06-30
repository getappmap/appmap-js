const { notNull } = require('../algorithms');

const BLACKLISTED_LABELS = new Set([
  'format.json.generate',
  'format.yaml.generate',
  'http.session.read',
]);

module.exports = class {
  constructor(appmap, coalesceEvents) {
    this.appmap = appmap;
    this.coalesceEvents = coalesceEvents;
  }

  // eslint-disable-next-line class-methods-use-this
  whitelistedLabels(labels) {
    return [...labels].filter((label) => !BLACKLISTED_LABELS.has(label));
  }

  execute() {
    const events = this.appmap.events
      .filter((event) => event.isCall())
      .map(this.transform.bind(this))
      .filter(notNull);

    return this.coalesceEvents(events);
  }

  transform(event) {
    if (event.sql) {
      if (!this.sql) {
        return null;
      }

      return this.sql(event);
    }
    if (event.httpServerRequest) {
      if (!this.httpServerRequest) {
        return null;
      }

      return this.httpServerRequest(event);
    }
    if (event.httpClientRequest) {
      if (!this.httpClientRequest) {
        return null;
      }

      return this.httpClientRequest(event);
    }

    if (!this.functionCall) {
      return null;
    }

    return this.functionCall(event);
  }
};

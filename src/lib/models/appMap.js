import ClassMap from './classMap';
import CallTree from './callTree/callTree';
import { buildLabels } from './util';

export default class AppMap {
  constructor(data) {
    this.data = {
      events: [],
      classMap: [],
      ...data,
    };

    this.classMap = new ClassMap(this.data.classMap);
    this.callTree = new CallTree(this.events);
    this.classMap.bindEvents(this.events);

    this.labels = buildLabels(this.classMap, this.events);

    // Establish event linked list references
    let previousEvent;
    this.events.forEach((e) => {
      if (previousEvent) {
        e.previous = previousEvent;
        previousEvent.next = e;
      }

      previousEvent = e;
    });

    // Keep these fields seperate for serialization
    delete this.data.classMap;
  }

  get version() {
    return this.data.version;
  }

  get metadata() {
    return this.data.metadata || {};
  }

  get name() {
    return this.metadata.name;
  }

  get rootEvent() {
    return this.callTree.rootEvent;
  }

  get events() {
    return this.data.events;
  }

  shallowCopy() {
    const copy = new AppMap({});
    copy.data.events = this.data.events;
    copy.data.metadata = this.data.metadata;
    copy.classMap = this.classMap;
    copy.callTree = this.callTree;
    return copy;
  }

  toJSON() {
    return {
      ...this.data,
      classMap: this.classMap,
    };
  }
}

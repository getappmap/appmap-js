import ClassMap from './classMap';
import CallTree from './callTree/callTree';
import {
  buildLabels,
  hashEvent,
  hashedPositionalInsert,
  resolveDifferences,
} from './util';

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

  // Retrieve an array of root entry point events (currently, just HTTP server requests). If none
  // are found, return all the root nodes which have no caller.
  rootEvents() {
    let events = this.events.filter((e) => e.isCall() && e.httpServerRequest);
    if (events.length === 0) {
      events = this.events.filter((e) => e.isCall() && !e.parent);
    }
    return events;
  }

  // Iterate many AppMaps at once as an event tree. This method will follow the deepest branch
  // available, and yield the nodes at that position. Given that the tree structure may differ
  // across AppMaps, it's possible that some nodes will be null.
  static *multiTreeIterator(baseAppMap, workingAppMap) {
    let baseEvent;
    let workingEvent;
    const baseQueue = baseAppMap.rootEvents();
    const workingQueue = workingAppMap.rootEvents();

    resolveDifferences(baseQueue, workingQueue);

    for (;;) {
      baseEvent = baseQueue.shift();
      workingEvent = workingQueue.shift();

      if (!baseEvent && !workingEvent) {
        // every path is exhausted - we're done iterating
        return;
      }

      const baseChildren = baseEvent ? [...baseEvent.children] : [];
      const workingChildren = workingEvent ? [...workingEvent.children] : [];

      resolveDifferences(baseChildren, workingChildren);
      baseChildren.forEach((e) => baseQueue.push(e));
      workingChildren.forEach((e) => workingQueue.push(e));

      yield [baseEvent, workingEvent];
    }
  }

  static getDiff(baseAppMap, workingAppMap) {
    const changeSummary = {
      changed: [],
      added: [],
      removed: [],
    };

    const iter = AppMap.multiTreeIterator(baseAppMap, workingAppMap);
    let result = iter.next();
    while (!result.done) {
      const [nodeBase, nodeWorking] = result.value;

      if (!nodeBase) {
        changeSummary.added.push(nodeWorking);
      } else if (!nodeWorking) {
        changeSummary.removed.push(nodeBase);
      } else if (nodeBase.hash !== nodeWorking.hash) {
        changeSummary.changed.push([nodeBase, nodeWorking]);
      }

      result = iter.next();
    }

    return changeSummary;
  }

  toJSON() {
    return {
      ...this.data,
      classMap: this.classMap,
    };
  }
}

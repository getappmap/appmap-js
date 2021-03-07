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
  static *multiTreeIterator(...appmaps) {
    let nodes = [];
    const queues = [];

    appmaps.forEach((a) => queues.push(a.rootEvents()));

    while (1) {
      nodes = queues.map((q) => q.shift());
      if (!nodes.find(Boolean)) {
        // every path of every tree is exhausted
        // we're done iterating
        return;
      }

      const children = nodes.map((n) => (n ? n.children : []));
      const maxChildren = Math.max(...children.map((c) => c.length));
      for (let i = 0; i < maxChildren; i += 1) {
        queues.forEach((q, k) => q.push(children[k][i] || null));
      }

      yield nodes;
    }
  }

  static getDiff(baseAppMap, ...workingAppMaps) {
    const changeSummary = {
      changed: [],
      added: [],
      removed: [],
    };

    const iter = AppMap.multiTreeIterator(baseAppMap, ...workingAppMaps);
    let result = iter.next();
    while (!result.done) {
      const [nodeBase, nodeWorking] = result.value;
      console.log(nodeBase.toString(), nodeWorking.toString());

      if (!nodeBase) {
        changeSummary.added.push(nodeWorking);
      } else if (!nodeWorking) {
        changeSummary.removed.push(nodeBase);
      } else if (!nodeBase.compare(nodeWorking)) {
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

import ClassMap from './classMap';
import CallTree from './callTree/callTree';
import { buildLabels, resolveDifferences, getRootEvents } from './util';

// merge contiguous changes into a single element (as an array)
function groupChanges(eventArray) {
  const events = new Set(eventArray);
  const seen = new Set();
  const result = [];

  eventArray.forEach((e) => {
    if (seen.has(e)) {
      return;
    }

    seen.add(e);

    const group = [e];
    let currentEvent = e;
    for (;;) {
      const { nextSibling } = currentEvent;
      if (nextSibling && events.has(nextSibling)) {
        group.push(nextSibling);
        seen.add(nextSibling);
        currentEvent = nextSibling;
      } else {
        break;
      }
    }

    result.push(group);
  });

  return result;
}

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

    this.eventsById = this.events.reduce((acc, event) => {
      acc[event.id] = event;
      return acc;
    }, {});

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

  getEvent(eventId) {
    return this.eventsById[eventId];
  }

  shallowCopy() {
    const copy = new AppMap({});
    copy.data.events = this.data.events;
    copy.data.metadata = this.data.metadata;
    copy.classMap = this.classMap;
    copy.callTree = this.callTree;
    return copy;
  }

  // Gets an array of root events, which is all events whose parent is undefined.
  rootEvents() {
    return getRootEvents(this.events);
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

      // If both are null, every path has been exhausted. We're done.
      if (!baseEvent && !workingEvent) {
        return;
      }

      // Don't bother continuing to iterate through a branch that doesn't exist in the other tree.
      if (baseEvent && workingEvent) {
        const baseChildren = baseEvent ? [...baseEvent.children] : [];
        const workingChildren = workingEvent ? [...workingEvent.children] : [];

        resolveDifferences(baseChildren, workingChildren);
        baseChildren.forEach((e) => baseQueue.push(e));
        workingChildren.forEach((e) => workingQueue.push(e));
      }

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

    changeSummary.added = groupChanges(changeSummary.added);
    changeSummary.removed = groupChanges(changeSummary.removed);

    return changeSummary;
  }

  toJSON() {
    return {
      ...this.data,
      classMap: this.classMap,
    };
  }
}

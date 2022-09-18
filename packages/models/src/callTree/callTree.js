import CallNode from './callNode';
import EventSource from '../eventSource';

export default class CallTree extends EventSource {
  constructor(events, functionLabels = () => []) {
    super();

    this.dataStore = {
      rootEvent: this.rootNode,
      selectedEvent: this.rootNode,
    };

    this.rootEvent = new CallNode();
    const stack = [this.rootEvent];
    events.forEach((e) => {
      if (e.event !== 'call') {
        if (stack.length > 1) {
          stack.pop();
        }
        return;
      }

      const parent = stack[stack.length - 1];
      const callNode = new CallNode(e, e.returnEvent, parent, functionLabels(e));
      parent.addChild(callNode);
      stack.push(callNode);
    });

    return this;
  }

  get rootEvent() {
    return this.dataStore.rootEvent;
  }

  set rootEvent(event) {
    this.dataStore.rootEvent = event;
    this.emit('rootEvent', event);
  }

  get selectedEvent() {
    return this.dataStore.selectedEvent;
  }

  set selectedEvent(event) {
    this.dataStore.selectedEvent = event;
    this.emit('selectedEvent', event);
  }
}

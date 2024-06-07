export default class EventStack {
  constructor(id) {
    this.events = [];
    this.stack = [];
    this.id = id;
    this.eventMap = {};
  }

  add(event) {
    if (event.isCall()) {
      this.stack.push(event);
      this.eventMap[event.id] = event;
    } else {
      if (typeof event.parent_id === 'undefined') {
        const lastEvent = this.stack[this.stack.length - 1];
        if (
          lastEvent &&
          lastEvent.defined_class === event.defined_class &&
          lastEvent.method_id === event.method_id &&
          lastEvent.path === event.path &&
          lastEvent.static === event.static
        ) {
          event.parent_id = lastEvent.id; // eslint-disable-line no-param-reassign
        } else {
          // An event has returned but the last call in the stack was not its
          // caller. There's not really anything we can do to rectify this, so
          // the event will be discarded.
          return;
        }
      }

      const call = this.eventMap[event.parent_id];
      if (call) {
        call.link(event);
        this.stack.pop();

        const parent = this.stack[this.stack.length - 1];
        if (call === parent) {
          // FIXME: This shouldn't ever happen, but there's an unknown issue in some AppMaps that
          // causes it. Without this check, node will crash, so preempt that by throwing an Error.
          throw new Error(`failed trying to compute event stack, call.id: ${call.id}`);
        }

        if (parent) {
          parent.children.push(call);
          call.parent = parent;
        }
      } else {
        // This can happen in async contexts where the recording began in the middle
        // of another async task. It's possible that the parent call was executed
        // before the recording began. If this is the case, discard the return event.
        return;
      }
    }

    this.events.push(event);
  }

  unwound() {
    return this.events.length > 0 && this.stack.length === 0;
  }
}

export default class EventStack {
  constructor(id) {
    this.events = [];
    this.stack = [];
    this.id = id;
    this.eventMap = {};
  }

  add(event) {
    // Don't begin a stack with a return, we likely started recording in the
    // middle of thread execution.
    if (event.isReturn() && this.events.length === 0) {
      return;
    }

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
        if (parent) {
          parent.children.push(call);
          call.parent = parent;
        }
      } else {
        throw new Error(`return #${event.id} is missing call #${event.parent_id}`);
      }
    }

    this.events.push(event);
  }

  unwound() {
    return this.events.length > 0 && this.stack.length === 0;
  }
}

export default class EventStack {
  constructor(id) {
    this.events = [];
    this.stack = [];
    this.id = id;
    this.eventMap = {};
  }

  add(event) {
    if (event.isCall()) {
      // Nest the call under whichever call was open when it was made. Doing this here, rather
      // than when the call returns, is what keeps an async recording in shape: a call whose
      // return arrives after a later call was made is still a child of the call it was made
      // from, and a call that never returns at all is still in the tree.
      const parent = this.stack[this.stack.length - 1];
      if (parent) {
        parent.children.push(event);
        event.parent = parent; // eslint-disable-line no-param-reassign
      }
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
      if (!call) {
        // This can happen in async contexts where the recording began in the middle
        // of another async task. It's possible that the parent call was executed
        // before the recording began. If this is the case, discard the return event.
        return;
      }

      call.link(event);

      // The call that returned is not always the one on top of the stack. appmap-node writes an
      // async call's return when its promise settles, which can be after calls made from it, or
      // from the code that awaited it, have themselves been recorded. So close the call this
      // return names, wherever it sits, and leave the rest of the stack open.
      const openAt = this.stack.lastIndexOf(call);
      if (openAt >= 0) this.stack.splice(openAt, 1);
    }

    this.events.push(event);
  }

  /**
   * The events in call order: each call, then the events of the calls made from it, then its own
   * return. For a recording whose returns all arrive in stack order this is the order they were
   * added in. For an async recording, where a return can arrive after a later call was made, it
   * is the shape the calls actually had, which is what anything that reads the event array as a
   * stack (a sequence diagram, for one) needs.
   */
  ordered() {
    const result = [];
    // An explicit stack rather than recursion: a recording can nest thousands of calls deep.
    const pending = this.events
      .filter((event) => event.isCall() && !event.parent)
      .reverse()
      .map((call) => ({ call, opened: false }));

    while (pending.length > 0) {
      const frame = pending[pending.length - 1];
      if (frame.opened) {
        pending.pop();
        if (frame.call.returnEvent) result.push(frame.call.returnEvent);
      } else {
        frame.opened = true;
        result.push(frame.call);
        const { children } = frame.call;
        for (let i = children.length - 1; i >= 0; i -= 1) {
          pending.push({ call: children[i], opened: false });
        }
      }
    }

    return result;
  }

  unwound() {
    return this.events.length > 0 && this.stack.length === 0;
  }
}

import Event from '../event';

export default class EventStack {
  constructor(id) {
    this.events = [];
    this.stack = [];
    this.id = id;
    this.eventMap = {};
    // The call that was on top of the stack when each call was made. This is
    // the call's parent, even if the parent returns before the call does.
    this.callers = new Map();
    // Set when a call returns while calls made after it are still open. This
    // happens in async code, e.g. appmap-node records the return of an async
    // function when its promise settles. `this.events` is then no longer
    // properly nested and needs to be put back in order before use.
    this.outOfOrder = false;
  }

  add(event) {
    if (event.isCall()) {
      this.callers.set(event, this.stack[this.stack.length - 1]);
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
      // If the call is unknown, this can happen in async contexts where the
      // recording began in the middle of another async task. It's possible
      // that the parent call was executed before the recording began. If the
      // call is no longer on the stack, it has already returned. Either way,
      // discard the return event.
      const index = call ? this.stack.lastIndexOf(call) : -1;
      if (index === -1) return;

      if (index !== this.stack.length - 1) this.outOfOrder = true;
      this.stack.splice(index, 1);
      call.link(event);

      const parent = this.callers.get(call);
      if (parent) {
        parent.children.push(call);
        call.parent = parent;
      }
    }

    this.events.push(event);
  }

  unwound() {
    return this.events.length > 0 && this.stack.length === 0;
  }

  // Returns the events of this stack, properly nested: each call is followed
  // by the calls made during it, then by its return. This should only be
  // called once all the events have been added. `nextId` provides ids for any
  // returns this has to add.
  orderedEvents(nextId) {
    if (!this.outOfOrder) return this.events;

    const calls = this.events.filter((e) => e.isCall());
    const order = new Map(calls.map((call, index) => [call, index]));
    const callees = new Map(calls.map((call) => [call, []]));
    const roots = [];
    calls.forEach((call) => {
      const parent = this.callers.get(call);
      if (parent) callees.get(parent).push(call);
      else roots.push(call);
    });

    // Walk the calls depth first. Iterative, since call trees can be deep.
    const result = [];
    const pending = roots.reverse().map((call) => ({ call, insideReturned: false }));
    while (pending.length > 0) {
      const { call, insideReturned, exit } = pending.pop();
      if (exit) {
        if (call.returnEvent) result.push(call.returnEvent);
        continue; // eslint-disable-line no-continue
      }

      result.push(call);
      // A call that never returned, made during a call that did, needs a
      // return before its caller's, or the flat list would no longer be
      // nested. Calls made after it still count as made during it. This only
      // happens for stacks still open when the recording ends: a stack that
      // unwound has no calls left without a return.
      if (insideReturned && !call.returnEvent) {
        const returnEvent = new Event({
          id: nextId(),
          event: 'return',
          thread_id: call.thread_id,
          parent_id: call.id,
        });
        returnEvent.link(call);
        const parent = this.callers.get(call);
        parent.children.push(call);
        call.parent = parent; // eslint-disable-line no-param-reassign
      }
      call.children.sort((a, b) => order.get(a) - order.get(b));

      pending.push({ call, exit: true });
      const nested = insideReturned || Boolean(call.returnEvent);
      callees
        .get(call)
        .slice()
        .reverse()
        .forEach((callee) => pending.push({ call: callee, insideReturned: nested }));
    }

    return result;
  }
}

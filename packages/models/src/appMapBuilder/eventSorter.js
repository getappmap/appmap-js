import EventStack from './eventStack';
import { sizeof } from '../util';

function getStackId(collection) {
  return Object.keys(collection.activeStacks).length + collection.finalizedStacks.length;
}

// EventSorter is responsible for untangling an event array. It sorts events by
// thread execution order and drops leading return statements.
export default class EventSorter {
  constructor() {
    this.activeStacks = {};
    this.finalizedStacks = [];
  }

  // Add an event to be sorted. An event must be added through this method to
  // be collected.
  add(event) {
    let stack = this.activeStacks[event.thread_id];
    if (!stack) {
      const id = getStackId(this);
      stack = new EventStack(id);
      this.activeStacks[event.thread_id] = stack;
    }

    stack.add(event);

    if (stack.unwound()) {
      this.finalizedStacks.splice(stack.id, 0, stack.events);
      delete this.activeStacks[event.thread_id];
    }
  }

  // Calculate the serialized size of all events. This is more of an
  // approximation than an exact number.
  size() {
    let size = sizeof(Object.values(this.activeStacks));
    size += sizeof(this.finalizedStacks);
    return size;
  }

  // Returns an array of "chunks". A chunk is an array consisting of many
  // stacks. A stack is an array consisting of many events.
  collect() {
    // Join active and finalized stacks. We want to make sure we iterate over
    // every event.
    const stacks = [...this.finalizedStacks];
    Object.values(this.activeStacks).forEach((s) => stacks.splice(s.id, 0, s.events));

    return stacks.reduce((chunks, stack) => {
      if (stack.length === 0) {
        return chunks;
      }

      // We're the first chunk in, meaning we don't need to worry about any
      // chunks behind us. Just push it.
      if (chunks.length === 0) {
        chunks.push([stack]);
        return chunks;
      }

      // If the root event is an HTTP request, this a complete chunk. Push it.
      if (stack[0].http_server_request) {
        chunks.push([stack]);
        return chunks;
      }

      if (stack[0].http_client_request) {
        chunks.push([stack]);
        return chunks;
      }

      // Check to see if the previous chunk began with an HTTP request. If it
      // does, push a new chunk. Otherwise, append to the last chunk.
      const prevChunk = chunks[chunks.length - 1];
      const prevStack = prevChunk[prevChunk.length - 1];
      if (prevStack[0].http_server_request || prevStack[0].http_client_request) {
        chunks.push([stack]);
      } else {
        prevChunk.push(stack);
      }

      return chunks;
    }, []);
  }
}

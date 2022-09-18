import EventSource from '../eventSource';
import AppMap from '../appMap';
import ClassMap from '../classMap';
import Event from '../event';
import EventSorter from './eventSorter';
import { sizeof } from '../util';

function eventName(classMap, e) {
  const { callEvent } = e;
  const obj = classMap.codeObjectFromEvent(callEvent);
  if (obj) {
    return obj.id;
  }

  return `${callEvent.defined_class}${callEvent.static ? '.' : '#'}${callEvent.method_id}`;
}

// Performs an array of transform functions on an object. The transform function
// is expected to return the transformed object.
const transform = (transforms, obj, ...args) => transforms.reduce((x, fn) => fn(x, ...args), obj);

// AppMapBuilder is responsible for transforming appmap data before returning
// an AppMap model.
class AppMapBuilder extends EventSource {
  constructor(data) {
    super();

    this.sorter = new EventSorter();
    this.transforms = {
      event: [],
      stack: [],
      chunk: [],
    };

    if (data) {
      this.source(data);
    }
  }

  // Provide a source of data - i.e. an appmap JSON object
  source(data) {
    const dataType = typeof data;
    if (dataType === 'object') {
      this.data = { ...data };
    } else if (dataType === 'string') {
      this.data = JSON.parse(data);
    } else {
      throw new Error(`got invalid type ${dataType}, expected object or string`);
    }

    (this.data.events || []).forEach((e) => {
      if (this.data.eventUpdates && this.data.eventUpdates[e.id]) {
        // eslint-disable-next-line no-param-reassign
        e = this.data.eventUpdates[e.id];
      }
      this.sorter.add(new Event(e));
    });

    delete this.data.events;
    delete this.data.eventUpdates;

    return this;
  }

  // register an optional event transform
  event(fn) {
    console.assert(typeof fn === 'function');
    this.transforms.event.push(fn);
    return this;
  }

  // register a optional stack transform
  stack(fn) {
    console.assert(typeof fn === 'function');
    this.transforms.stack.push(fn);
    return this;
  }

  // register a optional chunk transform
  chunk(fn) {
    console.assert(typeof fn === 'function');
    this.transforms.chunk.push(fn);
    return this;
  }

  // normalize the appmap data before returning an Appmap model
  normalize() {
    // Remove credentials from git repository url
    if (/^https?/.test(this.data.metadata?.git?.repository)) {
      const url = new URL(this.data.metadata.git.repository);
      url.username = '';
      url.password = '';
      this.data.metadata.git.repository = url.toString();
    }

    // Re-index events
    let eventId = 1;
    this.event((event) => {
      /* eslint-disable no-param-reassign */
      event.id = eventId;
      eventId += 1;

      if (event.isCall() && event.returnEvent) {
        event.returnEvent.parent_id = event.id;
      }

      // Normalize status/status_code properties
      const { httpServerResponse, httpClientResponse } = event;
      if (event.isReturn()) {
        if (httpServerResponse && httpServerResponse.status_code) {
          httpServerResponse.status = httpServerResponse.status_code;
          delete httpServerResponse.status_code;
        }
        if (httpClientResponse && httpClientResponse.status_code) {
          httpClientResponse.status = httpClientResponse.status_code;
          delete httpClientResponse.status_code;
        }
      }

      // Normalize path info
      const { httpServerRequest } = event;
      if (httpServerRequest && httpServerRequest.normalized_path_info) {
        httpServerRequest.normalized_path_info = httpServerRequest.normalized_path_info.toString();
      }
      if (httpServerRequest && httpServerRequest.path_info) {
        httpServerRequest.path_info = httpServerRequest.path_info.toString();
      }

      return event;
      /* eslint-enable no-param-reassign */
    });

    // Balance the stack by adding dummy returns to calls which never return
    return this.stack((events) => {
      events
        .filter((e) => e.isCall() && !e.returnEvent)
        .reverse()
        .map((e) => {
          const returnEvent = new Event({
            event: 'return',
            thread_id: e.thread_id,
            parent_id: e.id,
          });
          returnEvent.link(e);
          return returnEvent;
        })
        .forEach((e) => events.push(e));

      return events;
    });
  }

  // Cut down the size of the event array before creating the Appmap model
  prune(sizeBytes) {
    console.assert(typeof sizeBytes === 'number');

    let classMap;
    let pruneRatio = 0;
    return this.on('preprocess', (d) => {
      classMap = new ClassMap(d.data.classMap);
      pruneRatio = Math.min(sizeBytes / d.size, 1);
    }).chunk((stacks) => {
      // We're storing size/count state in the global class map. This isn't
      // great but it works for now. Reset the counts for each chunk.
      classMap.visit((obj) => {
        /* eslint-disable no-param-reassign */
        obj.size = 0;
        obj.count = 0;
        /* eslint-enable no-param-reassign */
      });

      // Iterate each event, regardless of the stack
      stacks.flat(2).forEach((e) => {
        if (e.event !== 'call' || e.sql_query || e.http_server_request || e.http_client_request) {
          return;
        }

        const obj = classMap.codeObjectFromEvent(e);
        if (obj) {
          const objSize = sizeof(e);
          obj.size = obj.size + objSize || objSize;
          obj.count = obj.count + 1 || 1;
        }
      });

      // Build an array of code objects sorted by size. The largest object
      // will always be index 0.
      let totalBytes = 0;
      const eventAggregates = classMap.codeObjects
        .filter((obj) => obj.size)
        .sort((a, b) => a.size - b.size)
        .map((obj) => {
          totalBytes += obj.size;
          return {
            id: obj.id,
            count: obj.count,
            size: obj.size,
            totalBytes,
          };
        })
        .reverse();

      // Build a list of unique exclusions, starting with the largest event
      // type. Iterate until the estimated event array size is under our
      // threshold.
      const exclusions = new Set();
      for (let i = 0; i < eventAggregates.length; i += 1) {
        const eventInfo = eventAggregates[i];
        if (eventInfo.totalBytes <= totalBytes * pruneRatio) {
          break;
        }
        exclusions.add(eventInfo.id);
      }

      return stacks.map((events) =>
        events.filter((e) => {
          const { callEvent } = e;

          // If there's no call event, there's no need to retain this event
          if (!callEvent) {
            return false;
          }

          if (
            callEvent.http_server_request ||
            callEvent.http_client_request ||
            callEvent.sql_query
          ) {
            return true;
          }

          const name = eventName(classMap, e);
          return !exclusions.has(name);
        })
      );
    });
  }

  removeNoise() {
    if (!this.data.events) {
      return this;
    }

    const hasHttp = Boolean(
      this.data.events.find((e) => e.httpServerRequest || e.httpClientRequest)
    );
    if (!hasHttp) {
      // the entire file is noise - do nothing
      return this;
    }

    return this.chunk((stacks) =>
      stacks.filter((stack) => {
        if (!stack.length) {
          return false;
        }

        return Boolean(stack[0].httpServerRequest) || Boolean(stack[0].httpClientRequest);
      })
    );
  }

  collectEvents() {
    return this.sorter
      .collect()
      .map((chunk) => {
        const transformedChunk = transform(this.transforms.chunk, chunk);
        return transformedChunk.map((stack) => {
          const transformedStack = transform(this.transforms.stack, stack);
          return transformedStack.map((event) => transform(this.transforms.event, event));
        });
      })
      .flat(2);
  }

  // Returns an Appmap model after running transforms such as normalize, prune,
  // etc.
  build() {
    const size = this.sorter.size();
    this.emit('preprocess', { size, data: this.data });
    return new AppMap({ ...this.data, events: this.collectEvents() });
  }
}

export default function buildAppMap(data = null) {
  return new AppMapBuilder(data);
}

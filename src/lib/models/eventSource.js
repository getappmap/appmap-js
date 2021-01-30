function getListenerArray(eventSource, eventType) {
  /* eslint-disable no-param-reassign */
  let listeners = eventSource.listeners[eventType];
  if (!listeners) {
    listeners = [];
    eventSource.listeners[eventType] = listeners;
  }
  return listeners;
  /* eslint-enable no-param-reassign */
}

export default class EventSource {
  constructor() {
    this.listeners = {};
    this.anyListeners = [];
  }

  once(eventType, fn) {
    const handlers = getListenerArray(this, eventType);
    handlers.push({ fn, once: true });
    return this;
  }

  on(eventType, fn) {
    const handlers = getListenerArray(this, eventType);
    handlers.push({ fn });
    return this;
  }

  off(eventType, fn) {
    const handlers = this.listeners[eventType];

    if (handlers) {
      const updatedHandlers = handlers.filter((h) => h.fn && h.fn !== fn);
      if (updatedHandlers.length === 0) {
        delete this.listeners[eventType];
      } else if (updatedHandlers.length !== handlers.length) {
        this.listeners[eventType] = updatedHandlers;
      }
    }

    return this;
  }

  emit(eventType, data = undefined) {
    const handlers = this.listeners[eventType];

    if (handlers) {
      let includesOnce = false;
      handlers.forEach((handler) => {
        if (handler.once) {
          includesOnce = true;
        }

        try {
          handler.fn(data);
        } catch (e) {
          console.error(`error occurred while executing event ${eventType}`);
          console.error(e);
        }
      });

      if (includesOnce) {
        // Only reassign this value if we've encountered a handler that's run once
        this.listeners[eventType] = this.listeners[eventType].filter(
          (h) => !h.once,
        );
      }
    }

    this.anyListeners.forEach((eventSource) =>
      eventSource.emit(eventType, data),
    );

    return this;
  }

  // Pipe events from EventSource A to EventSource B. If `eventTypes` are
  // provided, bind only those types. Otherwise, pipe any event.
  pipe(eventSource, ...eventTypes) {
    if (eventTypes.length) {
      eventTypes.forEach((type) =>
        eventSource.on(type, (data) => this.emit(data)),
      );
      return this;
    }

    eventSource.any(this);
    return this;
  }

  // Bind `eventSource` to recieve any event sent from `this`.
  any(eventSource) {
    this.anyListeners.push(eventSource);
    return this;
  }
}

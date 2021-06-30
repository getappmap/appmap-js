// eslint-disable-next-line import/prefer-default-export
function notNull(event) {
  return event !== null && event !== undefined;
}

function buildTree(events) {
  const eventsById = events.reduce((memo, evt) => {
    if (!evt.id) {
      throw new Error('event.id is null');
    }
    // eslint-disable-next-line no-param-reassign
    memo[evt.id] = evt;
    return memo;
  }, {});

  const eventWithParentId = (parentId) => eventsById[parentId];
  const eventAtLowerDepth = (depth) => {
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (event.depth <= depth) {
        return event;
      }
    }
    return null;
  };

  const rootEvents = events.reduce((roots, event) => {
    // An event with no parent is a root.
    // When an event has a parent, but the parent cannot be located in the tree,
    // assign the event to the most recent event at a lower depth than the event.
    const parentId = event.parent_id;
    if (!parentId) {
      roots.push(event);
      return roots;
    }

    const parent =
      eventWithParentId(parentId) || eventAtLowerDepth(event.depth);

    if (parent) {
      if (!parent.children) {
        parent.children = [event];
      } else {
        parent.children.push(event);
      }
    } else {
      roots.push(event);
    }

    return roots;
  }, []);

  events.forEach((event) => {
    // eslint-disable-next-line no-param-reassign
    delete event.id;
    // eslint-disable-next-line no-param-reassign
    delete event.parent_id;
    // eslint-disable-next-line no-param-reassign
    delete event.depth;
  });

  const httpServerRequestEvents = rootEvents.filter(
    (e) => e.kind === 'http_server_request'
  );
  if (httpServerRequestEvents.length > 0) {
    return httpServerRequestEvents;
  }

  return rootEvents;
}

module.exports = {
  notNull,
  buildTree,
};

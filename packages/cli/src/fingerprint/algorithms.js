// eslint-disable-next-line import/prefer-default-export
function notNull(event) {
  return event !== null && event !== undefined;
}

function buildTree(events) {
  const eventsById = events
    .filter((event) => event.id)
    .reduce((memo, value) => {
      // eslint-disable-next-line no-param-reassign
      memo[value.id] = value;
      return memo;
    }, {});

  const rootEvents = events.reduce((roots, event) => {
    // An event with no parent is a root.
    // When an event has a parent, but the parent cannot be located in the tree,
    // assign the event to the previous known event
    let parentId = event.parent_id;
    if (!parentId) {
      roots.push(event);
      return roots;
    }

    let parent = eventsById[parentId];
    while (!parent && parentId >= 0) {
      parentId -= 1;
      parent = eventsById[parentId];
    }

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
  });

  return rootEvents;
}

module.exports = {
  notNull,
  buildTree,
};

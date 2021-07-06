// eslint-disable-next-line import/prefer-default-export
function notNull(event) {
  return event !== null && event !== undefined;
}

function makeUnique(events) {
  const eventsJSON = events.flat().map((e) => JSON.stringify(e));
  return [...new Set(eventsJSON)].sort().map((json) => JSON.parse(json));
}

function buildTree(events) {
  const eventsById = events.reduce((memo, evt) => {
    if (!evt.$event) {
      throw new Error('event.$event is null');
    }
    // eslint-disable-next-line no-param-reassign
    memo[evt.$event.id] = evt;
    return memo;
  }, {});

  const findParent = (appMapEvent) => {
    if (!appMapEvent) {
      return null;
    }

    const result = eventsById[appMapEvent.id];
    if (result) {
      return result;
    }

    return findParent(appMapEvent.parent);
  };

  const rootEvents = events.reduce((roots, event) => {
    // An event with no parent is a root.
    // When an event has a parent, find the closest ancestor which is present in the tree.
    const parent = findParent(event.$event.parent);

    if (!parent) {
      roots.push(event);
    } else if (!parent.children) {
      parent.children = [event];
    } else {
      parent.children.push(event);
    }

    return roots;
  }, []);

  events.forEach((event) => {
    // eslint-disable-next-line no-param-reassign
    delete event.$event;
  });

  const commands = rootEvents.filter(
    (e) =>
      e.kind === 'http_server_request' ||
      (e.labels && e.labels.includes('command'))
  );
  if (commands.length > 0) {
    return commands;
  }

  return rootEvents;
}

module.exports = {
  makeUnique,
  notNull,
  buildTree,
};

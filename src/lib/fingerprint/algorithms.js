// eslint-disable-next-line import/prefer-default-export
export function notNull(event) {
  return event !== null && event !== undefined;
}

export function compareEvents(first, second) {
  const diff = first.kind.localeCompare(second.kind);
  if (diff !== 0) {
    return diff;
  }

  return JSON.stringify(first).localeCompare(JSON.stringify(second));
}

export function uniqueEvents() {
  const set = new Set();
  return (event) => {
    const eventStr = JSON.stringify(event, null, 2);
    if (!set.has(eventStr)) {
      set.add(eventStr);
      return event;
    }
    return null;
  };
}

/**
 * It's essential to normalize SQL to remove trivial differences like WHERE clauses on
 * generated id values, timestamps, etc.
 *
 * @param {string} sql
 */
export function normalizeSQL(sql) {
  const sqlLower = sql.toLowerCase();
  const stopWords = ['where', 'limit', 'order by', 'group by', 'values', 'set'];
  const stopWordLocations = stopWords
    .map((word) => sqlLower.indexOf(` ${word}`))
    .filter((index) => index !== -1)
    .sort();
  if (stopWordLocations.length > 0) {
    const subSQL = sql.slice(0, stopWordLocations[0] - 1);
    return subSQL.replace(/\s([\w_]+)\(\s+'?[w\d]+'?)\s+)(?:\s|^)/g, '$1(...)');
  }

  console.warn(`Unparseable: ${sql}`);
  return 'Unparseable';
}

export function buildTree(events) {
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

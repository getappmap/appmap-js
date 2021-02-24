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

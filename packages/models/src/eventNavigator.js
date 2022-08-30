/* eslint-disable no-restricted-syntax */
export default class EventNavigator {
  constructor(event) {
    this.event = event;
  }

  get callEvent() {
    return this.event.callEvent;
  }

  get labels() {
    const { codeObject } = this.event;
    if (codeObject && codeObject.labels) {
      return codeObject.labels;
    }
    return null;
  }

  *self() {
    yield this;
  }

  *ancestors() {
    let event = this.callEvent.parent;

    while (event) {
      yield new EventNavigator(event);
      event = event.parent;
    }
  }

  /**
   * Generates all events which precede this event in the scenario.
   */
  *preceding() {
    for (const node of [this, ...this.ancestors()]) {
      if (node !== this) yield node;
      for (const sibling of node.precedingSiblings()) {
        for (const descendant of [...sibling.descendants()].reverse())
          yield descendant;
        yield sibling;
      }
    }
  }

  *following() {
    for (const descendant of this.descendants()) yield descendant;
    for (const node of [this, ...this.ancestors()]) {
      for (const sibling of node.followingSiblings()) {
        yield sibling;
        for (const descendant of sibling.descendants()) yield descendant;
      }
    }
  }

  *precedingSiblings() {
    const { parent } = this.callEvent;
    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(this.callEvent);
    for (let i = index - 1; i >= 0; i -= 1) {
      yield new EventNavigator(parent.children[i]);
    }
  }

  *followingSiblings() {
    const { parent } = this.callEvent;
    if (!parent) {
      return;
    }

    const index = parent.children.indexOf(this.callEvent);
    for (let i = index + 1; i < parent.children.length; i += 1) {
      yield new EventNavigator(parent.children[i]);
    }
  }

  *descendants(filterFn = () => true) {
    const queue = [...this.event.children];
    while (queue.length) {
      const event = queue.shift();
      if (filterFn(event)) {
        yield new EventNavigator(event);
        if (event.children) queue.unshift(...event.children);
      }
    }
  }

  hasLabel(label) {
    return this.hasLabels([label]);
  }

  hasLabels(...searchLabels) {
    if (!this.labels) {
      return false;
    }

    if (!searchLabels || !searchLabels.length) {
      return this.labels.size > 0;
    }

    return (
      searchLabels.filter((l) => this.labels.has(l)).length ===
      searchLabels.length
    );
  }
}

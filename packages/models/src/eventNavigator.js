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
    const ancestors = this.ancestors();
    let ancestor = ancestors.next();
    while (!ancestor.done) {
      yield new EventNavigator(ancestor.value);
      let precedingSibling = this.precedingSiblings.next();
      while (!precedingSibling.done) {
        yield new EventNavigator(precedingSibling.value);
        const descendants = precedingSibling.value.descendants();
        let descendant = descendants.next();
        while (!descendant.done) {
          yield new EventNavigator(descendant.value);
          descendant = descendants.next();
        }
        precedingSibling = this.precedingSiblings.next();
      }
      ancestor = ancestors.next();
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

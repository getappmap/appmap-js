import { EventSource } from '../../../models';

function transformElement(item, element) {
  if (typeof item.data.transform === 'function') {
    return item.data.transform(element);
  }
  return element;
}

export default class ContextMenuItem extends EventSource {
  constructor() {
    super();
    this.data = {
      text: 'Untitled item',
      selector: null,
      condition: null,
      transform: null,
    };
  }

  text(value) {
    this.data.text = value;
    return this;
  }

  selector(value) {
    this.data.selector = value;
    return this;
  }

  condition(fn) {
    this.data.condition = fn;
    return this;
  }

  transform(fn) {
    this.data.transform = fn;
    return this;
  }

  match(e) {
    const matchSelector = !this.data.selector || e.matches(this.data.selector);
    if (!matchSelector) {
      return false;
    }

    const subject = transformElement(this, e);
    if (!subject) {
      // we have a transform and it failed to resolve
      return false;
    }

    const matchCondition = !this.data.condition || this.data.condition(subject);
    return matchCondition;
  }
}

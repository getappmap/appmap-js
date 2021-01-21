import { addHiddenProperty } from './util';

export default class CodeObject {
  constructor(data, parent) {
    this.data = { ...data };

    if (!(this.data.labels instanceof Set)) {
      this.data.labels = new Set(this.data.labels);
    }

    this.parent = parent;
    this.children = [];
    if (this.parent) {
      this.parent.children.push(this);
    }

    addHiddenProperty(this, 'events', { writable: false, value: [] });
  }

  get id() {
    const tokens = this.buildId();

    if (this.parent && this.type === 'function') {
      const separator = this.static ? '.' : '#';
      tokens[tokens.length - 2] = separator;
    }

    return tokens.join('');
  }

  get name() {
    return this.data.name;
  }

  get type() {
    return this.data.type;
  }

  get static() {
    return this.data.static;
  }

  get location() {
    return this.data.location;
  }

  get labels() {
    return this.data.labels;
  }

  get events() {
    return this.$hidden.events;
  }

  // Gets the source locations for this code object. For a package, no source locations are returned
  // (there would be too many to be useful). For a class, the paths to all files which add methods to the class are
  // returned. For a function, the path and line number is returned.
  get locations() {
    switch (this.type) {
      case 'class':
        return Array.from(this.classLocations()).sort();
      case 'function':
        return [this.location];
      default:
        return [];
    }
  }

  get packageOf() {
    return [this, ...this.ancestors()]
      .filter((obj) => obj.type === 'package')
      .map((obj) => obj.name)
      .reverse()
      .join('/');
  }

  get classOf() {
    return [this, ...this.ancestors()]
      .filter((obj) => obj.type === 'class')
      .map((obj) => obj.name)
      .reverse()
      .join('::');
  }

  get classObject() {
    return [this, ...this.ancestors()].find((obj) => obj.type === 'class');
  }

  get packageObject() {
    return [this, ...this.ancestors()].find((obj) => obj.type === 'package');
  }

  descendants() {
    const queue = [...this.children];
    const children = [];

    while (queue.length) {
      const child = queue.pop();
      children.push(child);
      queue.push(...child.children);
    }

    return children;
  }

  ancestors() {
    let currentObject = this.parent;
    const parents = [];

    while (currentObject) {
      parents.push(currentObject);
      currentObject = currentObject.parent;
    }

    return parents;
  }

  visit(fn, stack = []) {
    stack.push(this);
    fn(this, stack);
    this.children.forEach((child) => child.visit(fn, stack));
    stack.pop();
  }

  buildId(tokens = []) {
    if (this.parent) {
      this.parent.buildId(tokens);

      let separator;
      switch (this.parent.type) {
        case 'package':
          separator = '/';
          break;
        case 'class':
          separator = '::';
          break;
        default:
          separator = '->';
      }
      tokens.push(separator);
    }
    tokens.push(this.name);
    return tokens;
  }

  classLocations(paths = new Set()) {
    this.children.forEach((child) => child.classLocations(paths));

    if (this.type === 'function') {
      const tokens = this.data.location.split(':', 2);
      paths.add(tokens[0]);
    }
    return paths;
  }

  toJSON() {
    const obj = {
      name: this.data.name,
      type: this.data.type,
    };

    if (this.data.type === 'function') {
      obj.static = this.data.static;
      obj.location = this.data.location;
    }

    if (this.children.length > 0) {
      obj.children = this.children;
    }

    return obj;
  }

  static constructDataFromEvent(event) {
    const data = {};

    if (event.httpServerRequest) {
      Object.assign(data, {
        type: 'HTTP',
        name: 'HTTP server requests',
        children: [
          {
            type: 'route',
            name: event.route,
          },
        ],
      });
    } else if (event.sqlQuery) {
      Object.assign(data, {
        type: 'SQL',
        name: 'Database',
        children: [
          {
            type: 'query',
            name: event.sqlQuery,
          },
        ],
      });
    } else {
      Object.assign(data, {
        type: 'class',
        name: event.definedClass,
        children: [
          {
            type: 'function',
            name: event.methodId,
            static: event.isStatic,
            location: '',
          },
        ],
      });
    }

    // Flag this object as having been created dynamically
    const queue = [data];
    while (queue.length) {
      const obj = queue.pop();
      obj.dynamic = true;
      if (obj.children) {
        obj.children.forEach((child) => queue.push(child));
      }
    }

    return data;
  }
}

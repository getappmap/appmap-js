import { addHiddenProperty, getSqlLabelFromString } from './util';

export const CodeObjectType = {
  DATABASE: 'database',
  QUERY: 'query',
  HTTP: 'http',
  ROUTE: 'route',
  PACKAGE: 'package',
  CLASS: 'class',
  FUNCTION: 'function',
};

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

    if (this.parent && this.type === CodeObjectType.FUNCTION) {
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
      case CodeObjectType.CLASS:
        return Array.from(this.classLocations()).sort();
      case CodeObjectType.FUNCTION:
        return [this.location];
      default:
        return [];
    }
  }

  get packageOf() {
    return [this, ...this.ancestors()]
      .filter((obj) => obj.type === CodeObjectType.PACKAGE)
      .map((obj) => obj.name)
      .reverse()
      .join('/');
  }

  get classOf() {
    return [this, ...this.ancestors()]
      .filter((obj) => obj.type === CodeObjectType.CLASS)
      .map((obj) => obj.name)
      .reverse()
      .join('::');
  }

  get classObject() {
    return [this, ...this.ancestors()].find(
      (obj) => obj.type === CodeObjectType.CLASS
    );
  }

  get packageObject() {
    return [this, ...this.ancestors()].find(
      (obj) => obj.type === CodeObjectType.PACKAGE
    );
  }

  get functions() {
    if (this.type === CodeObjectType.CLASS) {
      // getting the functions of a class should not return functions of nested classes
      return this.children.filter(
        (obj) => obj.type === CodeObjectType.FUNCTION
      );
    }

    return this.descendants().filter(
      (obj) => obj.type === CodeObjectType.FUNCTION
    );
  }

  get classes() {
    return [this, ...this.descendants()].filter(
      (obj) => obj.type === CodeObjectType.CLASS && obj.functions.length
    );
  }

  get allEvents() {
    return [this, ...this.descendants()].map((obj) => obj.events).flat();
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

  // Leafs retrieves the leaf objects for the current type that contain children of another type. It
  // is useful for retrieving children without worrying about types or deeply nested objects.
  //
  // For example, the leafs of the package "com" may be:
  // - com.myorg.myapp
  // - com.myorg.myapp.api
  //
  // Whereas its children would only contain "myorg", and its descendants would include functions
  // and classes from any other nested package.
  leafs() {
    const { type } = this;
    const queue = [this];
    const leafArray = [];

    while (queue.length) {
      const obj = queue.pop();
      const childrenOfType = obj.children.filter(
        (child) => child.type === type
      );

      // If this object has children of another type, consider it a leaf.
      // For example, a package containing a class.
      if (childrenOfType.length) {
        queue.push(...childrenOfType);
      }

      // If, however, this object has a variety of child types, it's both a leaf and a parent
      if (
        (!obj.children.length && obj.type === type) ||
        childrenOfType.length !== obj.children.length
      ) {
        leafArray.push(obj);
      }
    }

    return leafArray;
  }

  // Returns leafs of all children. Similar to the `classes` accessor, but returns children of any
  // type.
  childLeafs() {
    return this.children.map((child) => child.leafs()).flat();
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
        case CodeObjectType.PACKAGE:
          separator = '/';
          break;
        case CodeObjectType.CLASS:
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

    if (this.type === CodeObjectType.FUNCTION) {
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

    if (this.data.type === CodeObjectType.FUNCTION) {
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
        type: CodeObjectType.HTTP,
        name: 'HTTP server requests',
        children: [
          {
            type: CodeObjectType.ROUTE,
            name: event.route,
          },
        ],
      });
    } else if (event.sqlQuery) {
      Object.assign(data, {
        type: CodeObjectType.DATABASE,
        name: 'Database',
        children: [
          {
            type: CodeObjectType.QUERY,
            name: event.sqlQuery,
          },
        ],
      });
    } else {
      Object.assign(data, {
        type: CodeObjectType.CLASS,
        name: event.definedClass,
        children: [
          {
            type: CodeObjectType.FUNCTION,
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

  get inboundConnections() {
    return this.allEvents
      .filter((e) => e.parent)
      .map((e) => e.parent.codeObject);
  }

  get outboundConnections() {
    return this.allEvents
      .map((e) => e.children)
      .flat()
      .map((e) => e.codeObject);
  }

  get sqlQueries() {
    return this.allEvents
      .map((e) => e.children)
      .flat()
      .filter((e) => e.sql)
      .map((e) => e.codeObject);
  }

  get prettyName() {
    switch (this.type) {
      case CodeObjectType.FUNCTION:
        return `${this.classOf}${this.static ? '.' : '#'}${this.name}`;
      case CodeObjectType.CLASS:
        return this.classOf;
      case CodeObjectType.PACKAGE:
        return this.packageOf;
      case CodeObjectType.QUERY:
        return getSqlLabelFromString(this.name);
      default:
        return this.name;
    }
  }
}

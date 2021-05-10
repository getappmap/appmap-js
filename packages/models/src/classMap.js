import CodeObject, { CodeObjectType } from './codeObject';

// Recursively add a code object to an array
// If the code object exists in the array already, add its children to the
// existing code object instead.
function addCodeObject(codeObjectArray, codeObject, parent = null) {
  if (
    !codeObjectArray ||
    !Array.isArray(codeObjectArray) ||
    !codeObject ||
    !(codeObject instanceof CodeObject)
  ) {
    return;
  }

  // TODO.
  // This ignores static/non-static function collisions and function overloads, though this method
  // is never currently called in a context where those edge cases exist.
  const existingObject = codeObjectArray.find(
    (obj) => obj.type === codeObject.type && obj.name === codeObject.name
  );

  if (!existingObject) {
    codeObject.parent = parent; // eslint-disable-line no-param-reassign
    codeObjectArray.push(codeObject);
  } else {
    codeObject.children.forEach((child) =>
      addCodeObject(existingObject.children, child, existingObject)
    );
  }
}

function filterValidCodeObjects(children, validCodeObjects) {
  return children.filter((obj) => {
    obj.children = filterValidCodeObjects(obj.children, validCodeObjects);
    return validCodeObjects.has(obj);
  });
}

export default class ClassMap {
  constructor(classMap) {
    this.codeObjectsByLocation = {};
    this.codeObjects = [];
    this.codeObjectsById = {};
    this.roots = classMap.map((root) => this.buildCodeObject(root));
  }

  buildCodeObject(data, parent = null) {
    const co = new CodeObject(data, parent);
    this.codeObjects.push(co);
    this.codeObjectsById[co.id] = co;

    (data.children || []).forEach((child) => {
      this.buildCodeObject(child, co);
    });

    if (co.type !== 'package') {
      co.locations.forEach((location) => {
        let codeObjects = this.codeObjectsByLocation[location];
        if (!codeObjects) {
          codeObjects = [];
          this.codeObjectsByLocation[location] = codeObjects;
        }
        codeObjects.push(co);
      });
    }

    return co;
  }

  visit(fn) {
    this.roots.forEach((co) => co.visit(fn));
  }

  search(query) {
    const queryLower = query.toLowerCase();
    return this.codeObjects.filter(
      (co) => co.id.toLowerCase().indexOf(queryLower) !== -1
    );
  }

  codeObjectFromId(id) {
    return this.codeObjectsById[id];
  }

  codeObjectsAtLocation(location) {
    return this.codeObjectsByLocation[location] || [];
  }

  codeObjectFromEvent(event) {
    return this.codeObjects.find(
      (co) => co.id.indexOf(event.toString()) !== -1
    );
  }

  // Returns the first root code object of a given type or null if it doesn't exist
  root(type) {
    return this.roots.find((obj) => obj.type === type);
  }

  // Returns the root HTTP code object if it exists
  get httpObject() {
    return this.root(CodeObjectType.HTTP);
  }

  // Returns the root SQL code object if it exists
  get sqlObject() {
    return this.root(CodeObjectType.DATABASE);
  }

  // Binds an event array to code objects and vice versa. This allows use of
  // direct accessors: `Event.codeObject` and `CodeObject.events`. Additionally,
  // it guarantees non-null accessors, meaning it will construct a code object
  // for an event if it previously did not exist.
  bindEvents(events) {
    if (!events || !Array.isArray(events) || !events.length) {
      return;
    }

    const validCodeObjects = new Set();
    events
      .filter((e) => e.isCall())
      .forEach((e) => {
        let codeObject = this.codeObjectFromEvent(e);
        if (!codeObject) {
          const data = CodeObject.constructDataFromEvent(e);
          const rootObject = this.buildCodeObject(data);
          addCodeObject(this.roots, rootObject);

          // The object we created will always be a leaf
          codeObject = [rootObject, ...rootObject.descendants()].pop();
        }

        e.codeObject = codeObject;
        codeObject.events.push(e);

        const ancestors = codeObject.ancestors();
        validCodeObjects.add(codeObject);
        ancestors.forEach((obj) => validCodeObjects.add(obj));
      });

    this.codeObjects = this.codeObjects.filter((obj) =>
      validCodeObjects.has(obj)
    );

    this.roots = this.roots.filter((obj) => {
      obj.children = filterValidCodeObjects(obj.children, validCodeObjects);
      return validCodeObjects.has(obj);
    });

    Object.keys(this.codeObjectsByLocation).forEach((obj) => {
      if (!validCodeObjects.has(obj)) {
        delete this.codeObjectsByLocation[obj];
      }
    });

    Object.entries(this.codeObjectsById).forEach(([id, obj]) => {
      if (!validCodeObjects.has(obj)) {
        delete this.codeObjectsById[id];
      }
    });
  }

  toJSON() {
    // Don't write out code objects that were created during runtime
    return this.roots.filter((obj) => !obj.dynamic);
  }
}

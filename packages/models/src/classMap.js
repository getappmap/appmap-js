import CodeObject from './codeObject';
import { CodeObjectType } from './codeObjectType';

function indexCodeObject(co, codeObjects, codeObjectsById) {
  codeObjects.push(co);
  codeObjectsById[co.id] = co;
}

export default class ClassMap {
  constructor(classMap) {
    this.codeObjectsByLocation = {};
    this.codeObjects = [];
    this.codeObjectsById = {};

    const buildCodeObject = (data, parent = null) => {
      const co = new CodeObject(data, parent);
      indexCodeObject(co, this.codeObjects, this.codeObjectsById);

      (data.children || []).forEach((child) => {
        buildCodeObject(child, co);
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
    };

    this.roots = classMap.map((root) => buildCodeObject(root));
  }

  visit(fn) {
    this.roots.forEach((co) => co.visit(fn));
  }

  search(query) {
    const queryLower = query.toLowerCase();
    return this.codeObjects.filter((co) => co.id.toLowerCase().indexOf(queryLower) !== -1);
  }

  codeObjectFromId(id) {
    return this.codeObjectsById[id];
  }

  codeObjectsAtLocation(location) {
    return this.codeObjectsByLocation[location] || [];
  }

  codeObjectFromEvent(event) {
    let codeObject;
    // These types of events should not be reporting path and lineno, but sometimes
    // they do.
    if (!(event.httpServerRequest || event.httpClientRequest || event.sql)) {
      const { path, lineno } = event;
      const location = [path, lineno].filter((e) => e).join(':');
      if (location !== '') {
        const codeObjects = this.codeObjectsAtLocation(location);
        codeObject = codeObjects.find((o) => o.name === event.methodId);
        if (codeObject) {
          return codeObject;
        }
      }
    }

    return null;
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
          const findOrCreateCodeObject = (data, codeObjectArray, parent) => {
            // TODO: This ignores static/non-static function collisions and function overloads, though this method
            // is never currently called in a context where those edge cases exist.
            let newCodeObject = codeObjectArray.find(
              (obj) => obj.type === data.type && obj.name === data.name
            );

            if (!newCodeObject) {
              newCodeObject = new CodeObject(data, parent);
              if (!parent) {
                this.roots.push(newCodeObject);
              }
              indexCodeObject(newCodeObject, this.codeObjects, this.codeObjectsById);
            }

            return newCodeObject;
          };

          const dataElements = CodeObject.constructDataChainFromEvent(e);
          let parent = null;
          dataElements.forEach((dataElement) => {
            parent = findOrCreateCodeObject(
              dataElement,
              parent ? parent.children : this.roots,
              parent
            );
          });
          codeObject = parent;
        }

        e.codeObject = codeObject;
        codeObject.events.push(e);

        const ancestors = codeObject.ancestors();
        validCodeObjects.add(codeObject);
        ancestors.forEach((obj) => validCodeObjects.add(obj));
      });

    this.codeObjects = this.codeObjects.filter((obj) => validCodeObjects.has(obj));

    function filterCodeObjects(objectsList, allObjects) {
      return objectsList.filter((obj) => {
        if (allObjects.has(obj)) {
          obj.children = filterCodeObjects(obj.children, allObjects);
          return true;
        }
        return false;
      });
    }

    this.roots = filterCodeObjects(this.roots, validCodeObjects);

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
    return this.roots;
  }
}

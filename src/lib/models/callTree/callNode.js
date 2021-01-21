import { addHiddenProperty } from '../util';

// Deprecated. Prefer `Event` instead.
class CallNode {
  constructor(input = {}, output = {}, caller = null, labels = []) {
    this.input = input;
    this.output = output;
    this.children = [];
    this.labels = labels;

    // Cyclic references shall not be enumerable
    addHiddenProperty(this, 'caller', { value: caller });
  }

  get caller() {
    return this.$hidden.caller;
  }

  set caller(value) {
    this.$hidden.$hiddencaller = value;
  }

  clone() {
    const input = { ...this.input };
    const output = { ...this.output };
    const labels = [...this.labels];
    const newNode = new CallNode(input, output, null, labels);

    if (this.displayName) {
      newNode.displayName = this.displayName;
    }

    this.children.forEach((child) => {
      const newChild = child.clone();
      newNode.addChild(newChild);
      newChild.caller = newNode;
    });

    return newNode;
  }

  addChild(node) {
    this.children.push(node);
  }

  // Replace a given child with a different set of children.
  replaceChild(child, children) {
    const idx = this.children.indexOf(child);
    if (idx === -1) {
      throw new Error(`${child} not found in call tree`);
    }

    this.children.splice(idx, 1, ...children);
    /* eslint-disable no-param-reassign */
    children.forEach((c) => {
      c.caller = this;
    });
    child.caller = null;
    /* eslint-enable no-param-reassign */
  }

  removeChild(child) {
    const childIndex = this.children.indexOf(child);
    if (childIndex < 0) {
      throw new Error(`${child} found orphaned by ${this} !`);
    }
    this.children.splice(childIndex, 1);
  }

  postOrderForEach(fn, stack = []) {
    stack.push(this);
    const children = [...this.children];
    children.forEach((child) => child.postOrderForEach(fn, stack));
    fn(this, stack);
    stack.pop(this);
  }

  preOrderForEach(fn, stack = []) {
    stack.push(this);
    fn(this, stack);
    const children = [...this.children];
    children.forEach((child) => child.preOrderForEach(fn, stack));
    stack.pop(this);
  }

  forEach(fn) {
    this.postOrderForEach(fn);
  }

  // filter returns a tree in which all nodes match a condition. If a node fails the
  // condition, its children are adopted by it's parent.
  filter(conditionFn) {
    const root = this.clone();
    root.forEach((node, stack) => {
      if (node.isRoot()) {
        return;
      }

      if (!conditionFn(node, stack)) {
        const parent = node.caller;
        parent.replaceChild(node, node.children);
      }
    });

    return root;
  }

  // include returns a tree in which all leaf nodes match a condition.
  // If a node passes the condition, the node and all of its parents are retained
  // in the tree. If it fails, the node and its children are removed from the tree.
  // Note that if a node passes the condition, the condition will not be evaluated
  // for that node's parent nodes, since they are already marked as retained.
  include(conditionFn) {
    /* eslint-disable no-param-reassign */
    const root = this.clone();
    root.postOrderForEach((node, stack) => {
      if (node.isRoot()) {
        return;
      }

      if (node.marked_include && node.caller) {
        node.caller.marked_include = true;
        return;
      }

      node.marked_include = conditionFn(node, stack);
      if (node.marked_include) {
        if (node.caller) {
          node.caller.marked_include = true;
        }
        return;
      }

      if (node.caller) {
        node.caller.removeChild(node);
      }
    });

    root.postOrderForEach((node) => {
      delete node.marked_include;
    });

    return root;
    /* eslint-enable no-param-reassign */
  }

  // exclude returns a tree in which all nodes that match a condition are removed, along
  // with their child nodes.
  exclude(conditionFn) {
    const root = this.clone();
    root.forEach((node, stack) => {
      if (node.isRoot()) {
        return;
      }

      if (conditionFn(node, stack)) {
        const parent = node.caller;
        parent.removeChild(node);
      }
    });

    return root;
  }

  // toArray returns this tree as a one dimensional array
  toArray() {
    const childEvents = this.children.map((child) => child.toArray()).flat();

    if (this.isRoot()) {
      return childEvents;
    }

    return [this, ...childEvents];
  }

  // find calls find recursively on all children
  // iterates in pre-order
  find(fn) {
    if (fn(this)) {
      return this;
    }

    for (let i = 0; i < this.children.length; i += 1) {
      const match = this.children[i].find(fn);
      if (match) {
        return match;
      }
    }

    return null;
  }

  // depth returns the depth of this node
  depth() {
    return this.ancestors().length;
  }

  // ancestors returns an array of this nodes ancestors
  ancestors() {
    const nodes = [];

    let parent = this.caller;
    while (parent) {
      nodes.push(parent);
      parent = parent.caller;
    }

    return nodes;
  }

  // returns whether or not a node has a particular node in its ancestry
  hasAncestor(ancestor) {
    let node = this;
    while (node) {
      if (node === ancestor) {
        return true;
      }
      node = node.caller;
    }
    return false;
  }

  descendants() {
    return [this, ...this.children.map((x) => x.descendants()).flat()];
  }

  next() {
    if (this.children.length > 0) {
      return this.children[0];
    }

    let child = this;
    let parent = this.caller;
    const fnChildIndex = (n) => n === child;
    while (parent) {
      const myIndex = parent.children.findIndex(fnChildIndex);
      if (myIndex < 0) {
        throw new Error(`${this} found orphaned by ${parent}!`);
      }

      if (myIndex < parent.children.length - 1) {
        return parent.children[myIndex + 1];
      }

      child = parent;
      parent = parent.caller;
    }

    return null;
  }

  previous() {
    const parent = this.caller;
    if (!parent) {
      return null;
    }

    if (parent.children.length === 1) {
      return parent;
    }

    const myIndex = parent.children.findIndex((n) => n === this);
    if (myIndex < 0) {
      throw new Error(`${this.input.id} found orphaned by ${parent.input.id}!`);
    }

    if (myIndex > 0) {
      // this branch will yield our previous node
      let candidate = parent.children[myIndex - 1];

      // iterate until we find a leaf node
      while (candidate.children.length > 0) {
        candidate = candidate.children[candidate.children.length - 1];
      }

      return candidate;
    }

    return parent;
  }

  // return the node to the left, at given max depth
  left(depth) {
    const target = depth || this.depth();

    // find the target or the nearest descendant
    let current = this;
    for (;;) {
      const parent = current.caller;
      if (!parent) return this;

      const siblings = parent.children;
      const i = siblings.indexOf(current);
      if (i !== 0) {
        current = parent.children[i - 1];
        break;
      } else {
        current = parent;
      }
    }

    // find rightmost child closest to the right depth
    while (current.depth() !== target) {
      const { children } = current;
      if (children.length === 0) break;
      current = children[children.length - 1];
    }

    return current;
  }

  // return the node to the right, at given max depth
  right(depth) {
    const target = depth || this.depth();

    // find the target or the nearest descendant
    let current = this;
    for (;;) {
      const parent = current.caller;
      if (!parent) return this;

      const siblings = parent.children;
      const i = siblings.indexOf(current);
      if (i !== siblings.length - 1) {
        current = parent.children[i + 1];
        break;
      } else {
        current = parent;
      }
    }

    // find leftmost child closest to the right depth
    while (current.depth() !== target) {
      const { children } = current;
      if (children.length === 0) break;
      [current] = children;
    }

    return current;
  }

  isRoot() {
    return this.caller === null;
  }

  count() {
    let numNodes = 0;
    this.forEach(() => {
      numNodes += 1;
    });
    return numNodes;
  }

  get id() {
    if (this.input && this.input.id) {
      return this.input.id;
    }
    return null;
  }
}

export default CallNode;

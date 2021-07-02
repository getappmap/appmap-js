const { buildTree } = require('../algorithms');
const Base = require('./base');

module.exports = class extends Base {
  constructor(appmap) {
    super(appmap, buildTree);
  }

  transform(event) {
    const result = super.transform(event);
    if (!result) {
      return null;
    }

    result.id = event.id;
    if (event.parent) {
      result.parent_id = event.parent.id;
    }
    result.depth = event.depth;

    return result;
  }
};

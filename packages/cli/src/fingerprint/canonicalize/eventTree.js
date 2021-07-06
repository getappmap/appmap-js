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

    result.$event = event;

    return result;
  }
};

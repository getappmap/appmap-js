const { makeUnique } = require('../algorithms');
const Base = require('./base');

module.exports = class extends Base {
  constructor(appmap) {
    super(appmap, makeUnique);
  }
};

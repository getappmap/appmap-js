const { messageToSwaggerSchema } = require('./util');

class Schema {
  constructor() {
    this.examples = [];
  }

  addExample(message) {
    this.examples.push(message);
  }

  get empty() {
    return this.examples.length > 0;
  }

  schema() {
    const properties = {};
    this.examples
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((message) => {
        if (properties[message.name]) {
          return;
        }
        // eslint-disable-next-line no-multi-assign
        properties[message.name] = messageToSwaggerSchema(message);
      });
    if (Object.keys(properties).length === 0) {
      return null;
    }

    return {
      type: 'object',
      properties,
    };
  }
}

module.exports = Schema;

const format = require('format-util');

exports.AppmapError = class AppmapError extends Error {
  constructor(message, data = null) {
    super(message);
    this.data = data;
  }
};

exports.InputError = class InputError extends Error {};

exports.assert = (boolean, Error, template, ...values) => {
  if (!boolean) {
    throw new Error(format(template, ...values));
  }
};

exports.assertSuccess = (closure, Error, template, ...values) => {
  try {
    return closure();
  } catch (error) {
    throw new Error(format(template, ...values, error.message));
  }
};

const { default: Ajv } = require('ajv');
const { default: betterAjvErrors } = require('@sidvind/better-ajv-errors');

function validateConfig(schema, config) {
  const ajv = new Ajv({ allErrors: true });
  const validate = ajv.compile(schema);

  const valid = validate(config);
  const result = { valid };
  if (!valid) {
    result.errors = betterAjvErrors(schema, config, validate.errors);
  }
  return result;
}

module.exports = { validateConfig };

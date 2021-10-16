import Ajv from 'ajv';
import betterAjvErrors, { IOutputError } from '@sidvind/better-ajv-errors';

type ValidationResult = {
  valid: boolean,
  errors?: {
    js: IOutputError[],
    cli: string
  }
};

export class ConfigValidationError extends Error {
  constructor(readonly result: ValidationResult) {
    super(result.errors!.js.toString());
  }
}

export function validateConfig(schema: object, config: object): ValidationResult {
  const ajv = new Ajv();
  const validate = ajv.compile<object>(schema);

  const valid = validate(config);
  let result: ValidationResult = {valid};
  if (!valid) {
    result = {
      ...result,
      errors: {
        js: betterAjvErrors(schema, config, validate.errors, {format: 'js'}),
        cli: betterAjvErrors(schema, config, validate.errors, {format: 'cli'}),
      }
    }
  }
  return result;
}

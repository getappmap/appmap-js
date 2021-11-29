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
  // If schema is an array, it's actually a collection of schemas, and the
  // 'config' schema will be found within it (i.e. will have '"$id"' set to
  // "config"). Otherwise, it's just a single schema, so just add it as a schema
  // named "config".
  const schemaKey = Array.isArray(schema)? undefined: "config";
  ajv.addSchema(schema, schemaKey);
  const validate = ajv.getSchema('config')!;
  const valid = validate(config) as boolean;
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

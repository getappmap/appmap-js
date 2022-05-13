import { ParameterObject } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import SchemaInferrer from './schemaInferrer';

export default class ObjectSchema {
  examples: Required<ParameterObject>[];

  constructor() {
    this.examples = [];
  }

  addExample(message: ParameterObject): void {
    const hasName = (p: ParameterObject): p is Required<ParameterObject> => !!p.name;
    if (hasName(message)) {
      this.examples.push(message);
    }
  }

  get empty(): boolean {
    return this.examples.length > 0;
  }

  schema(): OpenAPIV3.NonArraySchemaObject | undefined {
    const schemata: Record<string, SchemaInferrer> = {};
    this.examples
      .filter((message) => message.name)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((message) => {
        if (!schemata[message.name]) {
          schemata[message.name] = new SchemaInferrer();
        }
        schemata[message.name].addExample(message);
      });
    if (Object.keys(schemata).length === 0) {
      return;
    }

    const properties = Object.keys(schemata).reduce((memo, name) => {
      const schema = schemata[name].openapi();
      if (schema) memo[name] = schema;
      return memo;
    }, {} as Record<string, OpenAPIV3.SchemaObject>);
    return {
      type: 'object',
      properties,
    };
  }
}

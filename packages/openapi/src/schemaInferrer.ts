import { ValueBase } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { messageToOpenAPISchema } from './util';

function mergeProperties(a: any, b: any): any {
  a ||= {};
  b ||= {};

  return Object.keys(a)
    .concat(Object.keys(b))
    .reduce<any>((memo, key) => {
      memo[key] = mergeType(a[key] || {}, b[key] || {});
      return memo;
    }, {});
}

// Merge type, items and properties of schema objects.
function mergeType(
  a: any,
  b?: any
): OpenAPIV3.ArraySchemaObject | OpenAPIV3.NonArraySchemaObject {
  if (b === null || b === undefined) return a;

  const result = Object.assign({}, a);
  if (!a.type) {
    result.type = b.type;
  } else if (b.type === 'array') {
    result.type = 'array';
  } else if (b.type === 'object') {
    result.type = 'object';
  }

  if (a.items || b.items) {
    result.items = mergeType(a.items || {}, b.items);
    if (a.items?.properties || b.items?.properties) {
      result.items.properties = mergeProperties(
        a.items?.properties,
        b.items?.properties
      );
    }
  } else {
    if (a.properties || b.properties) {
      result.properties = mergeProperties(a.properties, b.properties);
    }
  }

  return result;
}

export default class SchemaInferrer {
  examples: ValueBase[];

  constructor() {
    this.examples = [];
  }

  openapi(): OpenAPIV3.SchemaObject | undefined {
    if (this.examples.length === 0) return;

    return this.examples.reduce((memo, example) => {
      const schema = messageToOpenAPISchema(example);
      return mergeType(memo, schema);
    }, {} as any);
  }

  addExample(value: ValueBase): void {
    this.examples.push(value);
  }
}

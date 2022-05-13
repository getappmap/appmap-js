import { ValueBase } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { messageToOpenAPISchema } from './util';

type Properties = { [name: string]: OpenAPIV3.SchemaObject };

function mergeProperties(props1?: Properties, props2?: Properties): Properties {
  const a = props1 || {};
  const b = props2 || {};

  const result: Properties = {};
  const props = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const key of props) {
    const merged = mergeType(a[key], b[key]);
    if (merged) result[key] = merged;
  }

  return result;
}


// Merge type, items and properties of schema objects.
function mergeType(
  a?: OpenAPIV3.SchemaObject,
  b?: OpenAPIV3.SchemaObject
): OpenAPIV3.SchemaObject | undefined {
  if (!b || !a) return a;
  if (b.type !== a.type) return a;

  if (a.type === 'array' && b.type === 'array') {
    if ('type' in a.items && 'type' in b.items) {
      const merged = mergeType(a.items, b.items);
      if (merged) return { ...a, items: merged };
    }
  }

  if ('properties' in a && 'properties' in b) {
    return { ...a, properties: mergeProperties(a.properties as Properties, b.properties as Properties) };
  }

  return a;
}

export default class SchemaInferrer {
  examples: ValueBase[];

  constructor() {
    this.examples = [];
  }

  openapi(): OpenAPIV3.SchemaObject | undefined {
    const schemas = this.examples.map(messageToOpenAPISchema).filter(Boolean);
    if (schemas.length === 0) return;

    return schemas.reduce(mergeType);
  }

  addExample(value: ValueBase): void {
    this.examples.push(value);
  }
}

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

const uniqueObjects = (
  array: (OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject)[]
): (OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject)[] => {
  return [
    ...new Map(
      array.map((item) => [
        (item as OpenAPIV3.SchemaObject).type || (item as OpenAPIV3.ReferenceObject).$ref,
        item,
      ])
    ).values(),
  ];
};

export function mergeItems(
  array1?: OpenAPIV3.ArraySchemaObject,
  array2?: OpenAPIV3.ArraySchemaObject
): OpenAPIV3.ArraySchemaObject {
  const a = array1 || { type: 'array', items: {} };
  const b = array2 || { type: 'array', items: {} };

  if (a === b) return a;
  if ((a.items as OpenAPIV3.ReferenceObject).$ref || (b.items as OpenAPIV3.ReferenceObject).$ref) {
    console.warn('Cannot merge array items with references');
    return a;
  }

  const isAmbiguousArrayA = isAmbiguousArray(a);
  const isAmbiguousArrayB = isAmbiguousArray(b);
  if (isAmbiguousArrayA && isAmbiguousArrayB) return a;
  if (isAmbiguousArrayB && !isAmbiguousArrayA) return a;
  if (isAmbiguousArrayA && !isAmbiguousArrayB) return b;

  const { items: itemsA } = a as { items: Readonly<OpenAPIV3.SchemaObject> };
  const { items: itemsB } = b as { items: Readonly<OpenAPIV3.SchemaObject> };

  if (itemsA.type === 'object' && itemsB.type === 'object') {
    // TODO
    // Note that this means we do not support mixed object types in arrays.
    // They'll all be merged into a single type.
    return {
      ...a,
      items: {
        ...mergeType(itemsA, itemsB),
      },
    };
  }

  if (itemsA.anyOf && itemsB.anyOf) {
    return {
      ...a,
      items: {
        anyOf: uniqueObjects(itemsA.anyOf.concat(itemsB.anyOf)),
      },
    };
  }

  if (itemsA.anyOf) {
    return {
      ...a,
      items: {
        anyOf: uniqueObjects(itemsA.anyOf.concat(itemsB)),
      },
    };
  }

  if (itemsB.anyOf) {
    return {
      ...a,
      items: {
        anyOf: uniqueObjects(itemsB.anyOf.concat(itemsA)),
      },
    };
  }

  if (itemsA.type === itemsB.type) {
    return a;
  }

  return {
    ...a,
    items: {
      anyOf: uniqueObjects([itemsA, itemsB]),
    },
  };
}

export function isAmbiguousArray(schema: OpenAPIV3.SchemaObject): boolean {
  if (schema.type === 'array') {
    return !schema.items || Object.keys(schema.items).length === 0;
  }

  return false;
}

// Merge type, items and properties of schema objects.
export function mergeType(
  a?: OpenAPIV3.SchemaObject,
  b?: OpenAPIV3.SchemaObject
): OpenAPIV3.SchemaObject | undefined {
  if (!b) return a;
  if (!a) return b;
  if (b.type !== a.type) return a;

  if (a.type === 'array' && b.type === 'array') {
    const merged = mergeItems(a, b);
    if (merged) return merged;
  }

  if ('properties' in a && 'properties' in b) {
    return {
      ...a,
      properties: mergeProperties(a.properties as Properties, b.properties as Properties),
    };
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

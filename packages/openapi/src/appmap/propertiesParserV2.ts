import { NamedParameterProperty, ParameterProperty } from '@appland/models';
import { OpenAPIV3 } from 'openapi-types';
import { type } from 'os';
import { SchemaExample } from '.';
import { mergeItems, mergeType } from '../schemaInferrer';
import { classNameToOpenAPIType } from '../util';

const mergeReducer = (acc: OpenAPIV3.SchemaObject, obj: OpenAPIV3.SchemaObject) =>
  mergeType(obj, acc) || acc || acc;

function parseProperty(paramProperty: ParameterProperty): OpenAPIV3.SchemaObject | undefined {
  const type = classNameToOpenAPIType(paramProperty.class);
  if (type === undefined) return undefined;

  if (paramProperty.items) {
    return parseArrayProperties(paramProperty.items);
  }

  if (type === 'array') {
    // If we made it here, we're an array with no additional information.
    return { type: 'array', items: {} };
  }

  if (paramProperty.properties) {
    return parseObjectProperties(paramProperty.properties);
  }

  // `type` should be an expected value, but TypeScript doesn't know that. Maybe there's
  // a smarter cast we can do here, but it's beyond me at the moment.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
  return { type: type as any };
}

function parseArrayProperties(
  paramProperties: ReadonlyArray<ParameterProperty>
): OpenAPIV3.ArraySchemaObject {
  const itemArray = paramProperties.map(parseProperty).filter(Boolean) as OpenAPIV3.SchemaObject[];

  if (itemArray.length === 0) return { type: 'array', items: {} };
  else if (itemArray.length === 1) return { type: 'array', items: itemArray[0] };

  const primitiveTypes = new Set(
    itemArray
      .filter((item) => item.type && item.type !== 'object' && item.type !== 'array')
      .map(
        ({ type }) => type as OpenAPIV3.NonArraySchemaObjectType | OpenAPIV3.ArraySchemaObjectType
      )
  );
  const primitives = Array.from(primitiveTypes).map((type) => ({
    type,
  })) as OpenAPIV3.SchemaObject[];
  const mergedArrays = itemArray
    .filter((item) => item.type === 'array')
    .reduce(mergeReducer, { items: {} } as OpenAPIV3.ArraySchemaObject);
  const mergedObject = itemArray
    .filter((item) => item.type === 'object')
    .reduce(mergeReducer, {} as OpenAPIV3.SchemaObject);
  const allMergedItems = [...primitives, mergedArrays, mergedObject].filter(
    (item) => item && item.type
  );

  if (allMergedItems.length === 0) {
    return { type: 'array', items: {} };
  }

  if (allMergedItems.length === 1) {
    return { type: 'array', items: allMergedItems[0] };
  }

  return { type: 'array', items: { anyOf: allMergedItems } };
}

function parseObjectProperties(
  paramProperties: ReadonlyArray<NamedParameterProperty>
): OpenAPIV3.SchemaObject {
  const properties = paramProperties.filter(Boolean).reduce((memo, msgProperty) => {
    const property = parseProperty(msgProperty);
    if (property) memo[msgProperty.name] = property;
    return memo;
  }, {} as Record<string, OpenAPIV3.SchemaObject>);

  return { type: 'object', properties };
}

export default class PropertiesParser {
  static canParse(example: SchemaExample): boolean {
    if (!example.properties) return true;

    const properties = [...example.properties, example as ParameterProperty];
    while (properties.length) {
      const property = properties.pop();
      if (!property) continue;

      const type = classNameToOpenAPIType(property.class);
      if (!type) continue;
      if (type === 'array' && property.items === undefined) return false;
      if (property.name === undefined) return true;
      if (property.class === undefined) return false;
      if (property.items !== undefined) return true;
      property.properties?.forEach((p) => properties.push(p));
    }

    return false;
  }

  static parse(example: SchemaExample): OpenAPIV3.SchemaObject | undefined {
    return parseProperty(example as ParameterProperty);
  }
}

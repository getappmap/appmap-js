import { OpenAPIV3 } from 'openapi-types';
import { SchemaExample } from '.';
import { classNameToOpenAPIType } from '../util';

export default class PropertiesParser {
  static canParse(): boolean {
    // We should be evaluating whether or not parsers can parse the example in reverse order.
    // This is the original implementation, so there's no other options. We're the last stand!
    return true;
  }

  static parse(example: SchemaExample): OpenAPIV3.SchemaObject | undefined {
    const type = classNameToOpenAPIType(example.class);
    if (type === undefined) return;

    if (example.properties) {
      const properties = example.properties.filter(Boolean).reduce((memo, msgProperty) => {
        // This guard clause is new. It's not in the original implementation. It also shouldn't be
        // necessary, as properties without a name should have been parsed by another parser.
        if (!msgProperty.name) return memo;

        const type = classNameToOpenAPIType(msgProperty.class);
        if (type === 'array') {
          let schema;
          if (msgProperty.properties) {
            // eslint-disable-next-line no-param-reassign
            schema = this.parse(msgProperty);
          }
          if (schema) {
            memo[msgProperty.name] = schema;
          } else {
            memo[msgProperty.name] = { type, items: {} } as OpenAPIV3.ArraySchemaObject;
          }
        } else if (type === 'object' && msgProperty.properties) {
          // eslint-disable-next-line no-param-reassign
          const schema = this.parse(msgProperty);
          if (schema) {
            memo[msgProperty.name] = schema;
          } else {
            memo[msgProperty.name] = { type };
          }
        } else if (type) {
          // eslint-disable-next-line no-param-reassign
          memo[msgProperty.name] = {
            type,
          };
        }
        return memo;
      }, {} as Record<string, OpenAPIV3.NonArraySchemaObject | OpenAPIV3.ArraySchemaObject>);
      if (type === 'array') {
        return { type: 'array', items: { type: 'object', properties } };
      } else {
        return { type: 'object', properties };
      }
    } else {
      if (type === 'array') {
        return { type: 'array', items: { type: 'string' } };
      }
    }

    return { type };
  }
}

import { OpenAPIV3 } from 'openapi-types';
import { NamedParameterProperty, ParameterProperty } from '@appland/models';
import { default as PropertiesParserV1 } from './propertiesParserV1';
import { default as PropertiesParserV2 } from './propertiesParserV2';

export type SchemaExample = {
  class: string;
  properties?: NamedParameterProperty[];
  items?: ParameterProperty[];
};

export interface PropertiesParser {
  canParse(example: SchemaExample): boolean;
  parse(example: SchemaExample): OpenAPIV3.SchemaObject | undefined;
}

const parsers: ReadonlyArray<PropertiesParser> = [PropertiesParserV2, PropertiesParserV1];
export function parse(example: SchemaExample): OpenAPIV3.SchemaObject | undefined {
  const parser = parsers.find((p) => p.canParse(example));
  if (parser) return parser.parse(example);
}

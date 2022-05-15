#!/usr/bin/env ts-node

import { writeFileSync } from 'fs';
import { createGenerator } from 'ts-json-schema-generator';

function generate(schemaId: string, path: string) {
  const generator = createGenerator({ path, schemaId });
  const schema = generator.createSchema();

  if (!schema.definitions) throw 'error generating schema';

  delete schema.definitions['MatchPatternConfig'];
  return JSON.stringify(schema, matchPatternConfigReplacer, 2);
}

function matchPatternConfigReplacer(key: string, value: string): string {
  if (key === '$ref' && value === '#/definitions/MatchPatternConfig')
    return 'https://appland.com/schemas/scanner/match-pattern-config.json';
  return value;
}

writeFileSync(
  'src/configuration/schema/configuration.json',
  generate(
    'https://appland.com/schemas/scanner/configuration.json',
    'src/configuration/types/configuration.ts'
  )
);

writeFileSync(
  'src/configuration/schema/options.json',
  generate('https://appland.com/schemas/scanner/options.json', 'src/rules/types.d.ts')
);

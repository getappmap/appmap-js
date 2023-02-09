import { promises as fs } from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
import { parse, SchemaExample } from '../src/appmap';
import PropertiesParserV1 from '../src/appmap/propertiesParserV1';
import PropertiesParserV2 from '../src/appmap/propertiesParserV2';
import { OpenAPIV3 } from 'openapi-types';
import { assert } from 'console';
import { mergeType } from '../src/schemaInferrer';

interface ExpectedExampleOutput {
  examples: ReadonlyArray<OpenAPIV3.SchemaObject>;
  mergeResult?: OpenAPIV3.SchemaObject;
}

const ExamplesDir = path.join(__dirname, 'data', 'examples');

const getExamples = (fixtureName: string) =>
  fs
    .readFile(path.join(ExamplesDir, fixtureName), 'utf8')
    .then(yaml.load)
    .then((data) => data as ReadonlyArray<SchemaExample>);

const getExpectedExampleOutput = (fixtureName: string) =>
  fs
    .readFile(path.join(ExamplesDir, 'expected', fixtureName), 'utf8')
    .then(yaml.load)
    .then((data) => data as ExpectedExampleOutput);

describe('PropertiesParser', () => {
  describe('version switching', () => {
    it('parses AppMaps adhering to v1.9.0 spec', async () => {
      const examples = await getExamples('appmap-v1.9.0.yml');
      expect(PropertiesParserV2.canParse(examples[0])).toBe(false);
      console.log(parse(examples[0]));
      expect(parse(examples[0])).toStrictEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            scenario_uuid: { type: 'string' },
            code_objects: { type: 'array', items: {} },
            metadata: { type: 'object' },
            labels: { type: 'array', items: {} },
          },
        },
      });
    });

    it('parses AppMaps adhering to v1.10.0 spec', async () => {
      const examples = await getExamples('appmap-v1.10.0.yml');
      expect(PropertiesParserV2.canParse(examples[0])).toBe(true);
      expect(parse(examples[0])).toStrictEqual({
        type: 'array',
        items: {
          type: 'object',
          properties: {
            scenario_uuid: { type: 'string' },
            code_objects: { type: 'array', items: {} },
            metadata: { type: 'object' },
            labels: { type: 'array', items: {} },
          },
        },
      });
    });

    describe('V1', () => {
      it('adds an empty object to array types if they cannot be determined', () => {
        expect(
          PropertiesParserV1.parse({
            class: 'Array',
            properties: [{ name: 'labels', class: 'Array' }],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              labels: { type: 'array', items: {} },
            },
          },
        });
      });
    });

    describe('V2', () => {
      it('merges array element types of the same type (array)', () => {
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [{ class: 'Array' }, { class: 'Array' }],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'array',
            items: {},
          },
        });
      });

      it('merges array element types of the same type (primitive)', () => {
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [{ class: 'Integer' }, { class: 'Integer' }],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'integer',
          },
        });
      });

      it('merges array element types of the same type (object)', () => {
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [
              { class: 'Hash', properties: [{ name: 'id', class: 'Integer' }] },
              { class: 'Hash', properties: [{ name: 'id', class: 'Integer' }] },
            ],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
            },
          },
        });
      });

      it('merges array element types of the same type (partial object)', () => {
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [
              {
                class: 'Hash',
                properties: [
                  { name: 'id', class: 'Integer' },
                  { name: 'name', class: 'String' },
                ],
              },
              {
                class: 'Hash',
                properties: [
                  { name: 'id', class: 'Integer' },
                  { name: 'uuid', class: 'String' },
                ],
              },
            ],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              uuid: { type: 'string' },
            },
          },
        });
      });

      it('merges nested arrays and objects', () => {
        const arrayElement = {
          class: 'Hash',
          properties: [
            {
              name: 'nested_objects',
              class: 'Array',
              items: [{ class: 'Hash', properties: [{ name: 'id', class: 'Integer' }] }],
            },
          ],
        };
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [arrayElement, arrayElement, arrayElement],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            type: 'object',
            properties: {
              nested_objects: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'integer' } } },
              },
            },
          },
        });
      });

      it('merges array element types of mixed types', () => {
        expect(
          PropertiesParserV2.parse({
            class: 'Array',
            items: [{ class: 'Float' }, { class: 'Integer' }],
          })
        ).toStrictEqual({
          type: 'array',
          items: {
            anyOf: [{ type: 'number' }, { type: 'integer' }],
          },
        });
      });

      it('merges large objects', async () => {
        const expected = await getExpectedExampleOutput('deep-merge.yml');
        assert(expected.mergeResult !== undefined);

        const examples = await getExamples('deep-merge.yml');
        const results = examples.map((item) => PropertiesParserV2.parse(item));

        expected.examples.forEach((expected, index) => {
          expect(results[index]).toStrictEqual(expected);
        });

        expect(mergeType(results[0], results[1])).toStrictEqual(expected.mergeResult);
      });
    });
  });
});

import { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import Assertion from '../assertion';
import {
  AssertionConfig,
  AssertionPrototype,
  AssertionSpec,
  Configuration,
  EventFilter,
  MatchPatternConfig,
} from 'src/types';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import optionsSchema from './options-schema.json';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import schema from './schema.json';
import { capitalize, verbose } from '../scanner/util';
import { buildArray as buildEventFilterArray } from '../scanner/lib/matchPattern';

const ajv = new Ajv();

function makeFilter(patternConfigs: MatchPatternConfig[] | undefined): EventFilter[] {
  if (!patternConfigs) {
    return [];
  }

  return buildEventFilterArray(patternConfigs!);
}

function populateAssertion(assertion: Assertion, config: AssertionConfig): void {
  assertion.include = makeFilter(config.include);
  assertion.exclude = makeFilter(config.exclude);
  if (config.description) {
    assertion.description = config.description;
  }
}

async function buildBuiltinAssertion(config: AssertionConfig): Promise<AssertionPrototype> {
  const assertionSpec: AssertionSpec = (await import(`../scanner/${config.id}`)).default;

  let options: any;
  if (assertionSpec.Options) {
    options = new assertionSpec.Options();
  } else {
    options = {};
  }
  if (config.properties) {
    Object.keys(config.properties).forEach((name) => {
      const value = config.properties![name];
      options[name] = value;
    });
  }

  return {
    config: config,
    scope: assertionSpec.scope || 'root',
    enumerateScope: assertionSpec.enumerateScope === true ? true : false,
    build: () => {
      const result = assertionSpec.scanner(options);
      populateAssertion(result, config);
      return result;
    },
  };
}

const validate = (validator: ValidateFunction, data: any, context: string): void => {
  const valid = validator(data);
  if (!valid) {
    throw new Error(
      validator
        .errors!.map((err) => {
          let instance = err.instancePath;
          if (!instance || instance === '') {
            instance = context;
          }
          return `${instance} ${err.message} (${err.schemaPath})`;
        })
        .join(', ')
    );
  }
};

export default class ConfigurationProvider {
  constructor(private readonly config: string | Configuration) {}

  async getConfig(): Promise<AssertionPrototype[]> {
    let rawConfig: Configuration | undefined;
    if (typeof this.config === 'string') {
      const yamlConfig = await fs.readFile(this.config, 'utf-8');
      rawConfig = yaml.load(yamlConfig, {
        filename: this.config,
      }) as Configuration;
    } else {
      rawConfig = this.config;
    }

    validate(ajv.compile(schema), rawConfig, 'Scanner configuration');

    rawConfig.scanners
      .filter((scanner) => scanner.properties)
      .forEach((scanner) => {
        const id = scanner.id;
        const schemaKey = [capitalize(id), 'Options'].join('.');
        if (verbose()) {
          console.warn(schemaKey);
        }
        const propertiesSchema = (optionsSchema.definitions as Record<string, any>)[schemaKey];
        if (!propertiesSchema) {
          return;
        }
        if (verbose()) {
          console.warn(propertiesSchema);
          console.warn(scanner.properties);
        }
        validate(
          ajv.compile(propertiesSchema),
          scanner.properties || {},
          `${scanner.id} properties`
        );
      });

    return Promise.all(
      rawConfig.scanners.map(async (c: AssertionConfig) => buildBuiltinAssertion(c))
    );
  }
}

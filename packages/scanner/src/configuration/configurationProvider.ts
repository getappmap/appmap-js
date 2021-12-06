import { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import Assertion from '../assertion';
import { AssertionPrototype, AssertionSpec, EventFilter } from '../types';
import options_schema from './schema/options.json';
import match_pattern_config_schema from './schema/match-pattern-config.json';
import configuration_schema from './schema/configuration.json';
import { capitalize, verbose } from '../scanner/util';
import { buildFilters as buildEventFilterArray } from '../scanner/lib/matchEvent';
import Configuration from './types/configuration';
import AssertionConfig from './types/assertionConfig';
import MatchEventConfig from './types/matchEventConfig';

const ajv = new Ajv();
ajv.addSchema(match_pattern_config_schema);

function makeFilter(matchConfigs: MatchEventConfig[]): EventFilter[] {
  if (!matchConfigs) {
    return [];
  }

  return buildEventFilterArray(matchConfigs!);
}

function populateAssertion(assertion: Assertion, config: AssertionConfig): void {
  assertion.includeScope = makeFilter(
    (config.include || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  assertion.excludeScope = makeFilter(
    (config.exclude || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  assertion.includeEvent = makeFilter(
    (config.include || []).filter((item) => item.event).map((item) => item.event!)
  );
  assertion.excludeEvent = makeFilter(
    (config.exclude || []).filter((item) => item.event).map((item) => item.event!)
  );
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

    validate(ajv.compile(configuration_schema), rawConfig, 'Scanner configuration');

    rawConfig.scanners
      .filter((scanner) => scanner.properties)
      .forEach((scanner) => {
        const id = scanner.id;
        const schemaKey = [capitalize(id), 'Options'].join('.');
        if (verbose()) {
          console.warn(schemaKey);
        }
        const propertiesSchema = (options_schema.definitions as Record<string, any>)[schemaKey];
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

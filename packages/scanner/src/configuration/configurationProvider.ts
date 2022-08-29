import { ValidateFunction } from 'ajv';
import Ajv from 'ajv';
import yaml from 'js-yaml';
import { exists, promises as fs } from 'fs';

import { Rule, ScopeName } from '../types';
import Check from '../check';

import { camelize, capitalize, dasherize, verbose } from '../rules/lib/util';
import { buildFilters as buildEventFilterArray } from '../rules/lib/matchEvent';
import { Metadata } from '../rules/lib/metadata';
import parseRuleDescription from '../rules/lib/parseRuleDescription';

import options_schema from './schema/options.json';
import match_pattern_config_schema from './schema/match-pattern-config.json';
import Configuration from './types/configuration';
import CheckConfig from './types/checkConfig';
import { URL } from 'url';
import { promisify } from 'util';
import { join } from 'path';

const ajv = new Ajv();
ajv.addSchema(match_pattern_config_schema);

function loadFromFile(ruleName: string): () => Promise<Rule | undefined> {
  return async () => {
    let ruleSpec;
    try {
      ruleSpec = await import(`../rules/${ruleName}`);
    } catch (e) {
      return;
    }
    return ruleSpec.default;
  };
}

function loadFromDir(ruleName: string): () => Promise<Rule | undefined> {
  return async () => {
    let metadata: Metadata;
    let rule: Rule['build'];
    let options: unknown;
    try {
      metadata = (await import(`../rules/${ruleName}/metadata`)).default;
    } catch (e) {
      return;
    }

    try {
      rule = (await import(`../rules/${ruleName}/rule`)).default;
    } catch {
      console.warn(
        `Rule ${ruleName} has no rule.js or rule.ts file, or the file doesn't have a default export`
      );
      return;
    }

    if (verbose()) console.log(`Loaded rule ${ruleName}: ${rule}`);

    try {
      options = (await import(`../rules/${ruleName}/options`)).default;
      if (verbose()) console.log(`Loaded rule ${ruleName} options: ${options}`);
    } catch {
      // This is OK
    }

    const description = parseRuleDescription(ruleName);
    const references = Object.keys(metadata.references || {}).reduce((memo, key) => {
      memo[key] = new URL(metadata.references[key]);
      return memo;
    }, {} as Record<string, URL>);

    return {
      id: dasherize(ruleName),
      title: metadata.title,
      description,
      url: `https://appland.com/docs/analysis/rules-reference.html#${dasherize(ruleName)}`,
      labels: metadata.labels || [],
      scope: metadata.scope,
      enumerateScope: metadata.enumerateScope,
      impactDomain: metadata.impactDomain,
      impactSubdomains: metadata.impactSubdomains,
      references,
      Options: options,
      build: rule,
    } as Rule;
  };
}

async function buildBuiltinCheck(config: CheckConfig): Promise<Check> {
  const rule = await loadRule(config.rule);

  if (verbose()) {
    console.log(`Loaded rule: ${rule}`);
  }

  let options: typeof rule['Options'];
  if (rule.Options) {
    options = new rule.Options();
  } else {
    options = {};
  }
  if (config.properties) {
    Object.keys(config.properties).forEach((name) => {
      const value = config.properties![name];
      options[name] = value;
    });
  }

  const check = new Check(rule, options);

  if (config.scope) {
    check.scope = config.scope as ScopeName;
  }

  if (config.id) {
    check.id = dasherize(config.id);
  }

  check.includeScope = buildEventFilterArray(
    (config.include || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  check.excludeScope = buildEventFilterArray(
    (config.exclude || []).filter((item) => item.scope).map((item) => item.scope!)
  );
  check.includeEvent = buildEventFilterArray(
    (config.include || []).filter((item) => item.event).map((item) => item.event!)
  );
  check.excludeEvent = buildEventFilterArray(
    (config.exclude || []).filter((item) => item.event).map((item) => item.event!)
  );

  if (verbose()) {
    console.log(`Loaded check: ${check}`);
  }

  return check;
}

const validate = (validator: ValidateFunction, data: unknown, context: string): void => {
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

export async function loadRule(ruleName: string): Promise<Rule> {
  const ruleId = dasherize(ruleName);
  const rules: (Rule | undefined)[] = await Promise.all(
    [
      loadFromDir(ruleId),
      loadFromFile(ruleId),
      loadFromDir(camelize(ruleId)),
      loadFromFile(camelize(ruleId)),
    ].map(async (loader) => {
      return await loader();
    })
  );
  const rule = rules.find((rule) => rule);
  if (!rule) throw new Error(`Rule ${ruleName} not found`);

  return rule;
}

function hasDefinition(key: string): key is keyof typeof options_schema.definitions {
  return key in options_schema.definitions;
}

export async function loadConfig(config: Configuration): Promise<Check[]> {
  config.checks
    .filter((check) => check.properties)
    .forEach((check) => {
      const ruleId = check.rule;
      const schemaKey = [capitalize(ruleId), 'Options'].join('.');
      if (verbose()) {
        console.warn(schemaKey);
      }
      if (!hasDefinition(schemaKey)) {
        return;
      }
      const propertiesSchema = options_schema.definitions[schemaKey];
      if (verbose()) {
        console.warn(propertiesSchema);
        console.warn(check.properties);
      }
      validate(ajv.compile(propertiesSchema), check.properties || {}, `${ruleId} properties`);
    });

  return Promise.all(config.checks.map(async (c: CheckConfig) => buildBuiltinCheck(c)));
}

export async function parseConfigFile(configPath: string): Promise<Configuration> {
  if (!(await promisify(exists)(configPath))) {
    configPath = join(__dirname, '../sampleConfig/default.yml');
  }
  console.log(`Using scanner configuration file ${configPath}`);
  const yamlConfig = await fs.readFile(configPath, 'utf-8');
  return yaml.load(yamlConfig, {
    filename: configPath,
  }) as Configuration;
}

import ConfigurationProvider from './configurationProvider';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import { Script } from 'vm';
import Assertion from '../assertion';
import { Scope } from 'src/types';

interface BaseConfig {
  readonly id?: string;
  readonly include?: string[];
  readonly exclude?: string[];
  readonly description?: string;
}

interface CustomAssertionConfig extends BaseConfig {
  readonly scope: Scope;
  readonly where?: string;
  readonly assert: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface BuiltinAssertionConfig extends BaseConfig {}

function populateAssertion(assertion: Assertion, config: BaseConfig): void {
  if (config.include && config.include.length > 0) {
    assertion.include = config.include
      .map((fn) => new Script(fn))
      .map((script) => (event, appMap) => {
        return script.runInNewContext({ event, appMap, console });
      });
  }
  if (config.exclude && config.exclude.length > 0) {
    assertion.exclude = config.exclude
      .map((fn) => new Script(fn))
      .map((script) => (event, appMap) => script.runInNewContext({ event, appMap }));
  }
  if (config.description) {
    assertion.description = config.description;
  }
}

async function buildCustomAssertion(config: CustomAssertionConfig): Promise<Assertion> {
  const assert = new Script(config.assert);
  const assertion = new Assertion(config.scope, (event, appMap) =>
    assert.runInNewContext({ event, appMap })
  );
  if (config.where) {
    assertion.where = (event, appMap) =>
      new Script(config.where!).runInNewContext({ event, appMap });
  }
  populateAssertion(assertion, config);

  return assertion;
}

async function buildBuiltinAssertion(config: BuiltinAssertionConfig): Promise<Assertion> {
  const result = (await import(`../scanner/${config.id}`)).default();
  populateAssertion(result, config);
  return result;
}

export default class ConfigurationProviderYaml implements ConfigurationProvider {
  constructor(private readonly path: string) {}

  static get filePatterns(): readonly RegExp[] {
    return [/^(.*)\.ya?ml$/];
  }

  async getConfig(): Promise<readonly Assertion[]> {
    const yamlConfig = await fs.readFile(this.path, 'utf-8');
    const rawConfig = yaml.loadAll(yamlConfig, undefined, {
      filename: this.path,
    }) as BaseConfig[];
    return Promise.all(
      rawConfig.map(async (c: BaseConfig) => {
        if (c.id) {
          return buildBuiltinAssertion(c as BuiltinAssertionConfig);
        } else {
          return buildCustomAssertion(c as CustomAssertionConfig);
        }
      })
    );
  }
}

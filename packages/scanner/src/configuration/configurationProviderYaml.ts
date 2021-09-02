import ConfigurationProvider from './configurationProvider';
import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import { Script } from 'vm';
import Assertion from '../assertion';
import { Scope } from 'src/types';

interface YamlConfiguration {
  readonly scope: Scope;
  readonly where: string;
  readonly assert: string;
}

export default class ConfigurationProviderYaml implements ConfigurationProvider {
  constructor(private readonly path: string) {}

  static get filePatterns(): readonly RegExp[] {
    return [/^(.*)\.ya?ml$/];
  }

  async getConfig(): Promise<readonly Assertion[]> {
    const yamlConfig = await fs.readFile(this.path, 'utf-8');
    const config = yaml.loadAll(yamlConfig, undefined, {
      filename: this.path,
    }) as YamlConfiguration[];

    return config.map((c) => {
      const where = new Script(c.where);
      const assert = new Script(c.assert);
      const assertion = new Assertion(c.scope, (event, appMap) =>
        assert.runInNewContext({ event, appMap })
      );
      assertion.where = (event, appMap) => where.runInNewContext({ event, appMap });
      return assertion;
    });
  }
}

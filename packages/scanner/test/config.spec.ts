import { load } from 'js-yaml';
import Assertion from '../src/assertion';
import ConfigurationProvider from '../src/configuration/configurationProvider';
import { AssertionPrototype, Configuration } from '../src/types';

describe('YAML config test', () => {
  it('propagates property settings', async () => {
    const yamlConfig = `
    scanners:
    - id: slowHttpServerRequest
      properties:
        timeAllowed: 0.251
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const assertionPrototypes: readonly AssertionPrototype[] = await provider.getConfig();
    expect(assertionPrototypes).toHaveLength(1);
    const assertion = assertionPrototypes[0].build();
    expect(assertion.description).toEqual(`Slow HTTP server request (> 251ms)`);
  });

  it('converts string to RegExp as needed', async () => {
    const yamlConfig = `
    scanners:
    - id: missingAuthentication
      properties:
        - routes: /GET/
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const assertionPrototypes: readonly AssertionPrototype[] = await provider.getConfig();
    expect(assertionPrototypes).toHaveLength(1);
    const assertion = assertionPrototypes[0].build();
    expect(assertion.options.routes).toEqual([/.*/]);
  });
});

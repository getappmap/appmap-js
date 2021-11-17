import { load } from 'js-yaml';
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

  it('converts string to MatchPattern as needed', async () => {
    const yamlConfig = `
    scanners:
    - id: missingAuthentication
      include:
      - pattern: "/^GET\\b/"
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const assertionPrototypes: readonly AssertionPrototype[] = await provider.getConfig();
    expect(assertionPrototypes).toHaveLength(1);
    expect(assertionPrototypes[0].config.include!).toHaveLength(1);
    expect(assertionPrototypes[0].config.include![0].pattern).toEqual(`/^GET\b/`);
    const assertion = assertionPrototypes[0].build();
    expect(assertion.include).toHaveLength(1);
  });

  it('propagates Record properties', async () => {
    const yamlConfig = `
    scanners:
    - id: incompatibleHttpClientRequest
      properties:
        schemata:
          api.railsSampleApp.com: file:///railsSampleApp.openapiv3.yaml
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const assertionPrototypes: readonly AssertionPrototype[] = await provider.getConfig();
    expect(assertionPrototypes).toHaveLength(1);
    const assertion = assertionPrototypes[0].build();
    expect(assertion.options.schemata).toEqual({
      'api.railsSampleApp.com': 'file:///railsSampleApp.openapiv3.yaml',
    });
  });
});

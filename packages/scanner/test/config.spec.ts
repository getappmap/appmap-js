import { load } from 'js-yaml';
import Assertion from '../src/assertion';
import ConfigurationProviderYaml from '../src/configuration/configurationProviderYaml';
import { Configuration } from '../src/types';

describe('YAML config test', () => {
  it('propagates property settings', async () => {
    const yamlConfig = `
    scanners:
    - id: slowHttpServerRequest
      properties:
        timeAllowed: 0.251
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProviderYaml(configObj);
    const assertions: readonly Assertion[] = await provider.getConfig();
    expect(assertions).toHaveLength(1);
    const assertion = assertions[0];
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
    const provider = new ConfigurationProviderYaml(configObj);
    const assertions: readonly Assertion[] = await provider.getConfig();
    expect(assertions).toHaveLength(1);
    const assertion = assertions[0];
    expect(assertion.options.routes).toEqual([/.*/]);
  });
});

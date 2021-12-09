import { load } from 'js-yaml';
import Check from '../src/check';
import ConfigurationProvider from '../src/configuration/configurationProvider';
import Configuration from '../src/configuration/types/configuration';

describe('YAML config test', () => {
  it('propagates property settings', async () => {
    const yamlConfig = `
    checks:
    - rule: slowHttpServerRequest
      properties:
        timeAllowed: 0.251
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const checks: readonly Check[] = await provider.getConfig();
    expect(checks).toHaveLength(1);
    expect(checks[0].rule.title).toEqual(`Slow HTTP server request`);
  });

  it('loads event filter', async () => {
    const yamlConfig = `
    checks:
    - rule: missingAuthentication
      include:
        - scope:
            property: route
            test:
              include: GET
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const checks: readonly Check[] = await provider.getConfig();
    expect(checks).toHaveLength(1);
    expect(checks[0].includeScope!).toHaveLength(1);
  });

  it('propagates Record properties', async () => {
    const yamlConfig = `
    checks:
    - rule: incompatibleHttpClientRequest
      properties:
        schemata:
          api.railsSampleApp.com: file:///railsSampleApp.openapiv3.yaml
    `;
    const configObj = load(yamlConfig) as Configuration;
    const provider = new ConfigurationProvider(configObj);
    const checks: readonly Check[] = await provider.getConfig();
    expect(checks).toHaveLength(1);
    expect(checks[0].options.schemata).toEqual({
      'api.railsSampleApp.com': 'file:///railsSampleApp.openapiv3.yaml',
    });
  });
});

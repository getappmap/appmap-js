import { getConfigurationV2 } from '../../../src/rpc/configuration';

describe('v2.configuration.get', () => {
  function withEnvVars(envVars: Record<string, string> = {}) {
    const originalValues: Record<string, string | undefined> = {};

    beforeEach(() => {
      Object.entries(envVars).forEach(([key, value]) => {
        originalValues[key] = process.env[key];
        process.env[key] = value;
      });
    });

    afterEach(() => {
      Object.entries(originalValues).forEach(([key, value]) => {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      });
    });
  }

  describe('azure config', () => {
    describe('with instance name', () => {
      withEnvVars({
        AZURE_OPENAI_INSTANCE_NAME: 'test',
        AZURE_OPENAI_API_KEY: 'test',
        AZURE_OPENAI_API_VERSION: 'test',
        AZURE_OPENAI_API_DEPLOYMENT_NAME: 'my-deployment',
      });
      it('returns the expected config', async () => {
        const result = getConfigurationV2().handler(undefined);
        expect(result).toStrictEqual({
          baseUrl: 'https://test.openai.azure.com',
          model: 'my-deployment',
          projectDirectories: [],
          appmapConfigFiles: [],
          provider: 'openai',
        });
      });
    });

    describe('with base path', () => {
      withEnvVars({
        AZURE_OPENAI_BASE_PATH: 'https://test.api.microsoft.com',
        AZURE_OPENAI_API_KEY: 'test',
        AZURE_OPENAI_API_VERSION: 'test',
        AZURE_OPENAI_API_DEPLOYMENT_NAME: 'my-deployment',
      });
      it('returns the expected config', async () => {
        const result = getConfigurationV2().handler(undefined);
        expect(result).toStrictEqual({
          baseUrl: 'https://test.api.microsoft.com',
          model: 'my-deployment',
          projectDirectories: [],
          appmapConfigFiles: [],
          provider: 'openai',
        });
      });
    });
  });

  describe('with openai key set', () => {
    withEnvVars({
      OPENAI_API_KEY: 'test',
    });

    it('returns the expected config', async () => {
      const result = getConfigurationV2().handler(undefined);
      expect(result).toStrictEqual({
        baseUrl: 'https://api.openai.com',
        model: undefined,
        projectDirectories: [],
        appmapConfigFiles: [],
        provider: 'openai',
      });
    });
  });

  describe('with openai key set and base path', () => {
    withEnvVars({
      OPENAI_BASE_URL: 'https://test.api.openai.com',
      OPENAI_API_KEY: 'test',
    });

    it('returns the expected config', () => {
      const result = getConfigurationV2().handler(undefined);
      expect(result).toStrictEqual({
        baseUrl: 'https://test.api.openai.com',
        model: undefined,
        projectDirectories: [],
        appmapConfigFiles: [],
        provider: 'openai',
      });
    });
  });

  describe('with default settings', () => {
    it('returns the expected config', () => {
      const result = getConfigurationV2().handler(undefined);
      expect(result).toStrictEqual({
        // KEG: I am not sure why this isn't coming through as the default value of https://api.openai.com
        baseUrl: undefined,
        model: undefined,
        projectDirectories: [],
        appmapConfigFiles: [],
        provider: 'openai',
      });
    });
  });
});

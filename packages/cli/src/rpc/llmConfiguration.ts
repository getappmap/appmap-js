import { SELECTED_BACKEND } from '@appland/navie';

const azureVariables = [
  'AZURE_OPENAI_API_KEY',
  'AZURE_OPENAI_API_DEPLOYMENT_NAME',
  'AZURE_OPENAI_API_VERSION',
] as const;

const azureBasePath = 'AZURE_OPENAI_BASE_PATH';
const azureInstanceName = 'AZURE_OPENAI_INSTANCE_NAME';

export type LLMConfiguration = {
  baseUrl?: string;
  model?: string;
  provider: string;
};

function openAIBaseURL(): string | undefined {
  let baseUrl = process.env.OPENAI_BASE_URL;

  // Check if the user has configured Azure OpenAI
  // It's configured differently than the other providers, so we need to check for it separately.
  // We're basically coercing the Azure configuration into a single base URL.
  const azureConfigured = azureVariables.every((variable) => process.env[variable]);
  if (azureConfigured) {
    // AZURE_OPENAI_BASE_PATH isn't necessarily <instance_name>.openai.azure.com
    // It can be something like https://westeurope.api.microsoft.com/openai/deployments
    let azureBaseUrl = process.env[azureBasePath];
    if (process.env[azureInstanceName]) {
      azureBaseUrl = `https://${process.env[azureInstanceName]}.openai.azure.com`;
    }

    try {
      if (azureBaseUrl) {
        // This will throw if the URL is invalid.
        new URL(azureBaseUrl);

        baseUrl = azureBaseUrl;
      }
    } catch {
      // Invalid configuration, ignore it. It likely won't work anyway.
    }
  }

  if (!baseUrl && process.env.OPENAI_API_KEY) {
    baseUrl = 'https://api.openai.com';
  }
  return baseUrl;
}

function defaultBaseUrlForProvider(provider: string): string | undefined {
  switch (provider) {
    case 'azure':
    case 'openai':
      return openAIBaseURL();
    case 'anthropic':
      return 'https://api.anthropic.com/v1/';
    case 'vertex-ai':
      return 'https://googleapis.com';
    case 'ollama':
      return 'http://localhost:11434';
    default:
      return undefined;
  }
}

/**
 * Gets the default LLM configuration from the environment.
 * This does not include any dynamic changes made by the user.
 */
export function getLLMConfiguration(): LLMConfiguration {
  const provider = process.env.APPMAP_NAVIE_COMPLETION_BACKEND ?? SELECTED_BACKEND ?? 'openai';
  const baseUrl = defaultBaseUrlForProvider(provider);

  return {
    baseUrl,
    model: process.env.APPMAP_NAVIE_MODEL ?? process.env.AZURE_OPENAI_API_DEPLOYMENT_NAME,
    provider,
  };
}

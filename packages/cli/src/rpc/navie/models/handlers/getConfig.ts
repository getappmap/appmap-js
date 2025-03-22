import { NavieRpc } from '@appland/rpc';
import { RpcHandler } from '../../../rpc';

/**
 * This function is used to print a secret value as asterisks. If the value doesn't exists,
 * it returns undefined.
 * @param value the secret value
 * @returns the secret value as asterisks or undefined
 */
const formatSecret = (value?: string) => (value?.length ? '*'.repeat(value.length) : undefined);

export function navieModelsGetConfigV1(): RpcHandler<
  NavieRpc.V1.Models.GetConfig.Params,
  NavieRpc.V1.Models.GetConfig.Response
> {
  return {
    name: NavieRpc.V1.Models.GetConfig.Method,
    handler: () => [
      {
        provider: 'openai',
        apiKey: formatSecret(process.env.OPENAI_API_KEY),
        endpoint: process.env.OPENAI_BASE_URL,
      },
      {
        provider: 'anthropic',
        apiKey: formatSecret(process.env.ANTHROPIC_API_KEY),
      },
      {
        provider: 'google',
        apiKey: formatSecret(process.env.GOOGLE_WEB_CREDENTIALS),
      },
      {
        provider: 'ollama',
        endpoint: process.env.OLLAMA_BASE_URL,
      },
    ],
  };
}

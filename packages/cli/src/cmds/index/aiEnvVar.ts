export const AI_KEY_ENV_VARS = ['OPENAI_API_KEY', 'AZURE_OPENAI_API_KEY'];

export default function detectAIEnvVar(): string | undefined {
  return Object.keys(process.env).find((key) => AI_KEY_ENV_VARS.includes(key));
}

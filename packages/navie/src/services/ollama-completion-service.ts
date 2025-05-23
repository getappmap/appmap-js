import Trajectory from '../lib/trajectory';
import OpenAICompletionService from './openai-completion-service';

function getOllamaUrl(): string {
  let ollamaApiUrl = 'http://localhost:11434';
  const { OLLAMA_BASE_URL } = process.env;
  if (OLLAMA_BASE_URL) {
    try {
      const url = new URL(OLLAMA_BASE_URL);
      ollamaApiUrl = url.toString();
      console.warn(`OLLAMA_BASE_URL is set to ${OLLAMA_BASE_URL}`);
    } catch {
      console.warn(
        `invalid OLLAMA_BASE_URL: "${OLLAMA_BASE_URL}", using default API URL ${ollamaApiUrl}`
      );
    }
  }
  return ollamaApiUrl;
}

export const OLLAMA_URL = getOllamaUrl();

export default class OllamaCompletionService extends OpenAICompletionService {
  constructor(modelName: string, temperature: number, trajectory: Trajectory) {
    super(modelName, temperature, trajectory, `${OLLAMA_URL}/v1`, 'dummy');
  }
}

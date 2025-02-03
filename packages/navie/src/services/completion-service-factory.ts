import { warn } from 'node:console';

import GoogleVertexAICompletionService from './google-vertexai-completion-service';
import OpenAICompletionService from './openai-completion-service';
import AnthropicCompletionService from './anthropic-completion-service';
import CompletionService from './completion-service';
import Trajectory from '../lib/trajectory';
import MessageTokenReducerService from './message-token-reducer-service';
import { NavieModel } from '../navie';
import OllamaCompletionService from './ollama-completion-service';

interface Options {
  modelName: string;
  temperature: number;
  trajectory: Trajectory;
  backend?: Backend;
  selectedModel?: NavieModel;
}

const BACKENDS = {
  anthropic: AnthropicCompletionService,
  openai: OpenAICompletionService,
  ollama: OllamaCompletionService,
  'vertex-ai': GoogleVertexAICompletionService,
} as const;

type Backend = keyof typeof BACKENDS;

function determineCompletionBackend(
  provider = process.env.APPMAP_NAVIE_COMPLETION_BACKEND
): Backend {
  switch (provider) {
    case 'anthropic':
    case 'openai':
    case 'vertex-ai':
    case 'ollama':
      return provider;
    default:
    // pass
  }
  if ('ANTHROPIC_API_KEY' in process.env) return 'anthropic';
  if ('GOOGLE_WEB_CREDENTIALS' in process.env) return 'vertex-ai';
  if ('OPENAI_API_KEY' in process.env) return 'openai';
  return 'openai'; // fallback
}

export const SELECTED_BACKEND: Backend = determineCompletionBackend();

export default function createCompletionService({
  modelName,
  temperature,
  trajectory,
  selectedModel,
  backend = determineCompletionBackend(selectedModel?.provider),
}: Options): CompletionService {
  const messageTokenReducerService = new MessageTokenReducerService();
  warn(`Using completion service ${backend}`);
  return new BACKENDS[backend](
    selectedModel?.id ?? modelName,
    temperature,
    trajectory,
    messageTokenReducerService
  );
}

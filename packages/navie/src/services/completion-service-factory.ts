import { warn } from 'node:console';

import OpenAICompletionService from './openai-completion-service';
import AnthropicCompletionService from './anthropic-completion-service';
import CompletionService from './completion-service';

interface Options {
  modelName: string;
  temperature: number;
}

type Backend = 'anthropic' | 'openai';

function defaultBackend(): Backend {
  return 'ANTHROPIC_API_KEY' in process.env ? 'anthropic' : 'openai';
}

function environmentBackend(): Backend | undefined {
  switch (process.env.APPMAP_NAVIE_COMPLETION_BACKEND) {
    case 'anthropic':
    case 'openai':
      return process.env.APPMAP_NAVIE_COMPLETION_BACKEND;
    default:
      return undefined;
  }
}

export const SELECTED_BACKEND: Backend = environmentBackend() ?? defaultBackend();

export default function createCompletionService({
  modelName,
  temperature,
}: Options): CompletionService {
  const backend = environmentBackend() ?? defaultBackend();
  if (backend === 'anthropic') {
    warn('Using Anthropic AI backend');
    return new AnthropicCompletionService(modelName, temperature);
  }
  warn('Using OpenAI backend');
  return new OpenAICompletionService(modelName, temperature);
}

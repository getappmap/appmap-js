import { warn } from 'node:console';

import GoogleVertexAICompletionService from './google-vertexai-completion-service';
import OpenAICompletionService from './openai-completion-service';
import AnthropicCompletionService from './anthropic-completion-service';
import CompletionService from './completion-service';
import Trajectory from '../lib/trajectory';

interface Options {
  modelName: string;
  temperature: number;
  trajectory: Trajectory;
}

const BACKENDS = {
  anthropic: AnthropicCompletionService,
  openai: OpenAICompletionService,
  'vertex-ai': GoogleVertexAICompletionService,
} as const;

type Backend = keyof typeof BACKENDS;

function defaultBackend(): Backend | undefined {
  if ('ANTHROPIC_API_KEY' in process.env) return 'anthropic';
  if ('GOOGLE_WEB_CREDENTIALS' in process.env) return 'vertex-ai';
  if ('OPENAI_API_KEY' in process.env) return 'openai';
}

function environmentBackend(): Backend | undefined {
  switch (process.env.APPMAP_NAVIE_COMPLETION_BACKEND) {
    case 'anthropic':
    case 'openai':
    case 'vertex-ai':
      return process.env.APPMAP_NAVIE_COMPLETION_BACKEND;
    default:
      return undefined;
  }
}

export const SELECTED_BACKEND: Backend | undefined = environmentBackend() ?? defaultBackend();

export default function createCompletionService({
  modelName,
  temperature,
  trajectory,
}: Options): CompletionService {
  const backend = environmentBackend() ?? defaultBackend();
  if (backend && backend in BACKENDS) {
    warn(`Using completion service ${backend}`);
    return new BACKENDS[backend](modelName, temperature, trajectory);
  }
  warn(`No completion service available for backend ${backend}. Falling back to OpenAI.`);
  return new OpenAICompletionService(modelName, temperature, trajectory);
}

import { warn } from 'node:console';

import GoogleVertexAICompletionService from './google-vertexai-completion-service';
import OpenAICompletionService from './openai-completion-service';
import AnthropicCompletionService from './anthropic-completion-service';
import CompletionService from './completion-service';
import Trajectory from '../lib/trajectory';
import MessageTokenReducerService from './message-token-reducer-service';
import { NavieHeaders } from '../lib/navie-headers';

interface Options {
  modelName: string;
  temperature: number;
  trajectory: Trajectory;
  headers: NavieHeaders;
  backend?: Backend;
}

const BACKENDS = {
  anthropic: AnthropicCompletionService,
  openai: OpenAICompletionService,
  'vertex-ai': GoogleVertexAICompletionService,
} as const;

type Backend = keyof typeof BACKENDS;

function determineCompletionBackend(): Backend {
  switch (process.env.APPMAP_NAVIE_COMPLETION_BACKEND) {
    case 'anthropic':
    case 'openai':
    case 'vertex-ai':
      return process.env.APPMAP_NAVIE_COMPLETION_BACKEND;
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
  headers,
  backend = determineCompletionBackend(),
}: Options): CompletionService {
  const messageTokenReducerService = new MessageTokenReducerService();
  warn(`Using completion service ${backend}`);
  return new BACKENDS[backend](
    modelName,
    temperature,
    trajectory,
    messageTokenReducerService,
    headers
  );
}

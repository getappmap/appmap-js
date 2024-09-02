import createCompletionService from '../../src/services/completion-service-factory';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import AnthropicCompletionService from '../../src/services/anthropic-completion-service';
import Trajectory from '../../src/lib/trajectory';

describe('CompletionServiceFactory', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('creates an OpenAICompletionService by default', () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    const trajectory: Trajectory = jest.genMockFromModule<Trajectory>('../../src/lib/trajectory');
    const service = createCompletionService({ modelName: 'test', temperature: 1, trajectory });
    expect(service).toBeInstanceOf(OpenAICompletionService);
  });

  it('creates an AnthropicCompletionService when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    const trajectory: Trajectory = jest.genMockFromModule<Trajectory>('../../src/lib/trajectory');
    const service = createCompletionService({ modelName: 'test', temperature: 1, trajectory });
    expect(service).toBeInstanceOf(AnthropicCompletionService);
  });
});

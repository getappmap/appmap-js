import createCompletionService from '../../src/services/completion-service-factory';
import AnthropicCompletionService from '../../src/services/anthropic-completion-service';
import GoogleVertexAICompletionService from '../../src/services/google-vertexai-completion-service';
import OllamaCompletionService from '../../src/services/ollama-completion-service';
import OpenAICompletionService from '../../src/services/openai-completion-service';
import Trajectory from '../../src/lib/trajectory';

describe('CompletionServiceFactory', () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('creates an OpenAICompletionService by default', () => {
    process.env.OPENAI_API_KEY = 'openai-key';
    const trajectory = new Trajectory();
    const service = createCompletionService({ modelName: 'test', temperature: 1, trajectory });
    expect(service).toBeInstanceOf(OpenAICompletionService);
  });

  it('creates an AnthropicCompletionService when ANTHROPIC_API_KEY is set', () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    const trajectory = new Trajectory();
    const service = createCompletionService({ modelName: 'test', temperature: 1, trajectory });
    expect(service).toBeInstanceOf(AnthropicCompletionService);
  });

  it("abides by the selected model's provider", () => {
    process.env.ANTHROPIC_API_KEY = 'anthropic-key';
    const trajectory = new Trajectory();
    const examples = [
      { id: 'gpt-4o', provider: 'openai', expected: OpenAICompletionService },
      { id: 'claude-2', provider: 'anthropic', expected: AnthropicCompletionService },
      { id: 'deepseek-r1:8b', provider: 'ollama', expected: OllamaCompletionService },
      { id: 'gemini-1.5-turbo', provider: 'vertex-ai', expected: GoogleVertexAICompletionService },
    ] as const;
    examples.forEach(({ id, provider, expected }) => {
      const service = createCompletionService({
        modelName: 'overridden',
        temperature: 1,
        trajectory,
        selectedModel: { id, provider },
      });
      expect(service).toBeInstanceOf(expected);
    });
  });
});

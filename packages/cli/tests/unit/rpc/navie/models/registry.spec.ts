import ModelRegistry from '../../../../../src/rpc/navie/models/registry';

describe(ModelRegistry, () => {
  let modelRegistry: ModelRegistry;

  beforeEach(() => {
    // The model registry is a singleton, typically accessed via `ModelRegistry.instance`. However,
    // for testing purposes, we create a new instance to avoid side effects. The cast here is used
    // to avoid exposing the private constructor of the class.
    /*
      eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,
                               @typescript-eslint/no-unsafe-call,
                               @typescript-eslint/no-explicit-any
    */
    modelRegistry = new (ModelRegistry as any)();
  });

  describe('select', () => {
    const models = [
      { id: 'small', name: 'Model 1', provider: 'one', createdAt: '2023-01-01' },
      { id: 'medium', name: 'Model 2', provider: 'two', createdAt: '2023-01-02' },
      { id: 'large', name: 'Model 3', provider: 'three', createdAt: '2023-01-03' },
      { id: 'extra-large', name: 'Model 4', provider: 'two', createdAt: '2023-01-04' },
    ];

    beforeEach(() => {
      models.forEach((model) => {
        modelRegistry.add(model);
      });
    });

    it('selects a model by id', () => {
      modelRegistry.select('medium');
      expect(modelRegistry.selectedModel).toStrictEqual(models[1]);
    });

    it('selects a model scoped by provider', () => {
      modelRegistry.select('two:extra-large');
      expect(modelRegistry.selectedModel).toStrictEqual(models[3]);
    });

    it('is case insensitive', () => {
      modelRegistry.select('TWO:EXTRA-LARGE');
      expect(modelRegistry.selectedModel).toStrictEqual(models[3]);
    });
  });

  describe('add', () => {
    it('adds a model', () => {
      const model = { id: '1', name: 'Model 1', provider: 'example;com', createdAt: '2023-01-01' };
      modelRegistry.add(model);
      expect(modelRegistry.list()).toEqual([model]);
    });
    it("doesn't add duplicate models", () => {
      const model = { id: '1', name: 'Model 1', provider: 'example;com', createdAt: '2023-01-01' };
      modelRegistry.add(model);
      modelRegistry.add(model);
      expect(modelRegistry.list()).toEqual([model]);
    });
    it('selects a pending model if it did not exist before', () => {
      const model = {
        id: 'model',
        name: 'Test Model',
        provider: 'provider',
        createdAt: '2023-01-01',
      };
      modelRegistry.select('provider:model');
      expect(modelRegistry.selectedModel).toBeUndefined();
      modelRegistry.add(model);
      expect(modelRegistry.selectedModel).toEqual(model);
    });
  });

  describe('list', () => {
    it('inclues both client and api models', () => {
      const clientModel = {
        id: '1',
        name: 'client model',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      const apiModel = {
        id: '2',
        name: 'api model',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      modelRegistry.add(clientModel);
      modelRegistry['apiModels'] = [apiModel]; // eslint-disable-line @typescript-eslint/dot-notation
      expect(modelRegistry.list()).toEqual([clientModel, apiModel]);
    });
    it('does not include endpoint information', () => {
      const endpoint = {
        baseUrl: 'http://example.com',
        apiKey: 'example',
      };
      const clientModel = {
        id: 'example',
        name: 'example',
        provider: 'example',
        createdAt: '2023-01-01',
        maxInputTokens: 1000,
      };
      modelRegistry.add({ ...clientModel, ...endpoint });
      const models = modelRegistry.list();
      expect(models).toStrictEqual([clientModel]);
    });
    it('tags the primary model', () => {
      const model = {
        id: 'example',
        name: 'Model 1',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      modelRegistry.add(model);
      modelRegistry.select(model.id);
      expect(modelRegistry.list()).toStrictEqual([{ ...model, tags: ['primary'] }]);
    });
    it('tags recommended models in priority order', () => {
      const model = {
        id: 'claude-3-5-sonnet-latest',
        name: 'Model 1',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      modelRegistry.add(model);
      expect(modelRegistry.list()).toStrictEqual([{ ...model, tags: ['recommended'] }]);
    });
    it('tags models that are not recommended', () => {
      const model = {
        id: 'o1-thinking-extended-plus',
        name: 'Model 1',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      modelRegistry.add(model);
      expect(modelRegistry.list()).toStrictEqual([{ ...model, tags: ['alpha'] }]);
    });
    it('can provide more than one tag', () => {
      const model = {
        id: 'claude-3-5-sonnet-latest',
        name: 'Model 1',
        provider: 'example;com',
        createdAt: '2023-01-01',
      };
      modelRegistry.add(model);
      modelRegistry.select(model.id);
      expect(modelRegistry.list()).toStrictEqual([{ ...model, tags: ['recommended', 'primary'] }]);
    });
  });

  describe('refresh', () => {
    let fetchMock: jest.SpyInstance;
    const originalEnv = process.env;

    beforeEach(() => {
      const timestamp = new Date().toISOString();
      fetchMock = jest.spyOn(global, 'fetch').mockImplementation((url) => {
        // This mocks a union response of Ollama, Anthropic, and OpenAI
        const models = [
          {
            id: 'example',
            name: 'example',
            display_name: 'example',
            provider: url,
            modified_at: timestamp,
            created: timestamp,
            created_at: timestamp,
          },
        ];
        return Promise.resolve({
          json: () => ({
            models,
            data: models,
          }),
          ok: true,
        } as unknown as Response);
      });
    });
    afterEach(() => {
      jest.restoreAllMocks();
      process.env = { ...originalEnv };
    });

    it('always attempts to fetch ollama models', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;
      await modelRegistry.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(modelRegistry.list()).toStrictEqual(
        expect.arrayContaining([expect.objectContaining({ provider: 'Ollama' })])
      );
    });

    it('fetches anthropic models when ANTHROPIC_API_KEY is set', async () => {
      process.env.ANTHROPIC_API_KEY = 'dummy';
      delete process.env.OPENAI_API_KEY;
      await modelRegistry.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models?limit=100',
        expect.anything()
      );
      expect(modelRegistry.list()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'Anthropic' }),
          expect.objectContaining({ provider: 'Ollama' }),
        ])
      );
    });

    it('fetches openai models when OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'dummy';
      delete process.env.ANTHROPIC_API_KEY;
      await modelRegistry.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/models', expect.anything());
      expect(modelRegistry.list()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'OpenAI' }),
          expect.objectContaining({ provider: 'Ollama' }),
        ])
      );
    });

    it('gracefully handles fetch errors', async () => {
      fetchMock.mockImplementation(() => Promise.reject(new Error('Fetch failed')));
      await modelRegistry.refresh();
      expect(modelRegistry.list()).toStrictEqual([]);
    });

    it('selects a pending model if it did not exist before', async () => {
      delete process.env.ANTHROPIC_API_KEY;
      delete process.env.OPENAI_API_KEY;

      modelRegistry.select('Ollama:example');
      expect(modelRegistry.selectedModel).toBeUndefined();

      await modelRegistry.refresh();
      expect(modelRegistry.selectedModel?.id).toEqual('example');
    });
  });

  it('uses the default model from the environment if none is selected', () => {
    const originalEnv = process.env;
    process.env = { ...originalEnv, APPMAP_NAVIE_MODEL: 'test-model', APPMAP_NAVIE_COMPLETION_BACKEND: 'ollama' };
    const modelRegistry = ModelRegistry.instance;
    expect(modelRegistry.selectedModel).toMatchObject({ id: 'test-model', provider: 'ollama' });
    process.env = originalEnv;
  });
});

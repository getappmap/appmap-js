import ModelRegistry from '../../../../../src/rpc/navie/models/registry';

describe(ModelRegistry, () => {
  beforeEach(() => {
    (ModelRegistry as any).instance = new (ModelRegistry as any)();
  });

  describe('select', () => {
    it('selects a model', () => {
      const model = { id: '1', name: 'Model 1', provider: 'Provider 1', createdAt: '2023-01-01' };
      ModelRegistry.instance.select(model);
      expect(ModelRegistry.instance.selectedModel).toEqual(model);
    });
  });

  describe('add', () => {
    it('adds a model', () => {
      const model = { id: '1', name: 'Model 1', provider: 'example;com', createdAt: '2023-01-01' };
      ModelRegistry.instance.add(model);
      expect(ModelRegistry.instance.list()).toEqual([model]);
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
      ModelRegistry.instance.add(clientModel);
      ModelRegistry.instance['apiModels'] = [apiModel]; // eslint-disable-line @typescript-eslint/dot-notation
      expect(ModelRegistry.instance.list()).toEqual([clientModel, apiModel]);
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
      ModelRegistry.instance.add({ ...clientModel, ...endpoint });
      const models = ModelRegistry.instance.list();
      expect(models).toStrictEqual([clientModel]);
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
      await ModelRegistry.instance.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(ModelRegistry.instance.list()).toStrictEqual(
        expect.arrayContaining([expect.objectContaining({ provider: 'Ollama' })])
      );
    });

    it('fetches anthropic models when ANTHROPIC_API_KEY is set', async () => {
      process.env.ANTHROPIC_API_KEY = 'dummy';
      delete process.env.OPENAI_API_KEY;
      await ModelRegistry.instance.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/models?limit=100',
        expect.anything()
      );
      expect(ModelRegistry.instance.list()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'Anthropic' }),
          expect.objectContaining({ provider: 'Ollama' }),
        ])
      );
    });

    it('fetches openai models when OPENAI_API_KEY is set', async () => {
      process.env.OPENAI_API_KEY = 'dummy';
      delete process.env.ANTHROPIC_API_KEY;
      await ModelRegistry.instance.refresh();
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:11434/api/tags', expect.anything());
      expect(fetchMock).toHaveBeenCalledWith('https://api.openai.com/v1/models', expect.anything());
      expect(ModelRegistry.instance.list()).toStrictEqual(
        expect.arrayContaining([
          expect.objectContaining({ provider: 'OpenAI' }),
          expect.objectContaining({ provider: 'Ollama' }),
        ])
      );
    });

    it('gracefully handles fetch errors', async () => {
      fetchMock.mockImplementation(() => Promise.reject(new Error('Fetch failed')));
      await ModelRegistry.instance.refresh();
      expect(ModelRegistry.instance.list()).toStrictEqual([]);
    });
  });
});

import { NavieRpc } from '@appland/rpc';
import { verbose } from '../../../utils';
import { OLLAMA_URL } from '@appland/navie';

interface AnthropicModelResponse {
  data: {
    type: 'model';
    id: string;
    display_name: string;
    created_at: string;
  }[];
  has_more: boolean;
  first_id: string;
  last_id: string;
}

function normalizeDate(date: string | number) {
  if (typeof date === 'number') {
    return new Date(date * 1000).toISOString();
  }
  return new Date(date).toISOString();
}

async function fetchAnthropicModels(apiKey: string): Promise<NavieRpc.V1.Models.Model[]> {
  const models: NavieRpc.V1.Models.Model[] = [];
  const params = new URLSearchParams({ limit: '100' });
  let nextId: string | undefined;

  for (;;) {
    if (nextId) {
      params.set('after_id', nextId);
    }

    try {
      const res = await fetch(`https://api.anthropic.com/v1/models?${params.toString()}`, {
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      });

      if (!res.ok) {
        throw new Error(`recieved unexpected response ${res.status} ${res.statusText}`);
      }

      const json = (await res.json()) as AnthropicModelResponse;
      models.push(
        ...json.data.map((model) => ({
          id: model.id,
          name: model.display_name,
          provider: 'Anthropic',
          createdAt: normalizeDate(model.created_at),
        }))
      );

      if (!json.has_more) {
        break;
      }

      nextId = json.last_id;
    } catch (e) {
      console.error(`failed to fetch anthropic models: ${String(e)}`);
      break;
    }
  }

  return models;
}

interface OpenAiModelResponse {
  object: 'list';
  data: {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }[];
}

async function fetchOpenAIModels(apiKey: string): Promise<NavieRpc.V1.Models.Model[]> {
  const models: NavieRpc.V1.Models.Model[] = [];
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${apiKey}`,
      },
    });

    if (!res.ok) {
      throw new Error(`recieved unexpected response ${res.status} ${res.statusText}`);
    }

    const nonInternalModel = (model: OpenAiModelResponse['data'][number]) =>
      !['openai-internal', 'openai'].includes(model.owned_by);

    const isRelevantModel = (model: OpenAiModelResponse['data'][number]) =>
      model.owned_by !== 'system' ||
      !model.id.match(/preview|embedding|tts|moderation|dall-e|chatgpt|transcribe|\d{3,}/g);

    const json = (await res.json()) as OpenAiModelResponse;
    models.push(
      ...json.data
        .filter((model) => nonInternalModel(model) && isRelevantModel(model))
        .map((model) => ({
          id: model.id,
          name: model.id,
          provider: 'OpenAI',
          createdAt: normalizeDate(model.created),
        }))
    );
  } catch (e) {
    console.error(`failed to fetch openai models: ${String(e)}`);
  }

  return models;
}

interface OllamaModelResponse {
  models: {
    name: string;
    modified_at: string;
  }[];
}

async function fetchOllamaModels(): Promise<NavieRpc.V1.Models.Model[]> {
  const models: NavieRpc.V1.Models.Model[] = [];
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`, {
      headers: {
        'content-type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`received unexpected response ${res.status} ${res.statusText}`);
    }

    const json = (await res.json()) as OllamaModelResponse;
    models.push(
      ...json.models.map((model) => ({
        id: model.name,
        name: model.name,
        provider: 'Ollama',
        createdAt: normalizeDate(model.modified_at),
      }))
    );
  } catch (e) {
    if (verbose()) {
      console.error(`failed to fetch ollama models: ${String(e)}`);
    }
  }
  return models;
}

export default class ModelRegistry {
  private readonly recommendedModels = [/claude-3[-.]5-sonnet/, /gpt-4o/];
  private readonly notRecommendedModels = [/^o1-?.*$/, /^o3-?.*$/, /^claude-3[-.]7-sonnet-?.*$/];
  private clientModels = new Map<string, NavieRpc.V1.Models.ClientModel>();
  private apiModels: NavieRpc.V1.Models.Model[] = [];
  private _selectedModel?: NavieRpc.V1.Models.Model;

  static readonly instance = new ModelRegistry();

  private constructor() {
    // no-op
  }

  select(model: NavieRpc.V1.Models.Model) {
    this._selectedModel = model;
  }

  get selectedModel(): NavieRpc.V1.Models.Model | undefined {
    return this._selectedModel;
  }

  add(model: NavieRpc.V1.Models.ClientModel) {
    const key = `${model.provider.toLowerCase()}:${model.id.toLowerCase()}`;
    this.clientModels.set(key, model);
  }

  list(): NavieRpc.V1.Models.ListModel[] {
    const listModels: NavieRpc.V1.Models.ListModel[] = Array.from(this.clientModels.values())
      .map((m) => {
        const model = {
          id: m.id,
          name: m.name,
          provider: m.provider,
          createdAt: m.createdAt,
        } as NavieRpc.V1.Models.Model;
        if (m.maxInputTokens !== undefined) {
          model.maxInputTokens = m.maxInputTokens;
        }
        return model;
      })
      .concat(this.apiModels);

    const recommendation = this.recommendedModels.find((regex) =>
      listModels.some((m) => regex.test(m.id))
    );
    for (const model of listModels) {
      if (recommendation?.test(model.id)) {
        model.tags = ['recommended'];
      }
      if (model.id === this.selectedModel?.id) {
        if (model.tags) model.tags.push('primary');
        else model.tags = ['primary'];
      }
      if (this.notRecommendedModels.some((regex) => regex.test(model.id))) {
        if (model.tags) model.tags.push('alpha');
        else model.tags = ['alpha'];
      }
    }

    return listModels;
  }

  async refresh() {
    const promises: Promise<NavieRpc.V1.Models.Model[]>[] = [];
    const { ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENAI_BASE_URL } = process.env;

    if (ANTHROPIC_API_KEY) {
      promises.push(fetchAnthropicModels(ANTHROPIC_API_KEY));
    }

    if (OPENAI_API_KEY && (!OPENAI_BASE_URL || OPENAI_BASE_URL === 'https://api.openai.com')) {
      promises.push(fetchOpenAIModels(OPENAI_API_KEY));
    }

    promises.push(fetchOllamaModels());

    const results = await Promise.allSettled(promises);
    this.apiModels = results
      .filter(
        (result): result is PromiseFulfilledResult<NavieRpc.V1.Models.Model[]> =>
          result.status === 'fulfilled'
      )
      .flatMap((result) => result.value); // eslint-disable-line @typescript-eslint/no-unsafe-return
  }
}

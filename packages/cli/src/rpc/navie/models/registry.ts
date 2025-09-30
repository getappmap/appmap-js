import { NavieRpc } from '@appland/rpc';
import { verbose } from '../../../utils';
import { getLLMConfiguration } from '../../llmConfiguration';

import { fetchAnthropicModels } from './providers/anthropic';
import { fetchOllamaModels } from './providers/ollama';
import { fetchOpenAIModels } from './providers/openai';

const findModel = (
  arr: NavieRpc.V1.Models.Model[],
  id: string,
  provider?: string
): NavieRpc.V1.Models.Model | undefined => {
  const lowerId = id.toLowerCase();
  const lowerProvider = provider?.toLowerCase();
  return arr.find(
    (model) =>
      model.id.toLowerCase() === lowerId &&
      (!provider || model.provider.toLowerCase() === lowerProvider)
  );
};

export default class ModelRegistry {
  private readonly recommendedModels = [/claude-3[-.]5-sonnet/, /gpt-4o/];
  private readonly notRecommendedModels = [/^o1-?.*$/, /^o3-?.*$/, /^claude-3[-.]7-sonnet-?.*$/];
  private clientModels = new Map<string, NavieRpc.V1.Models.ClientModel>();
  private apiModels: NavieRpc.V1.Models.Model[] = [];
  private _selectedModel?: NavieRpc.V1.Models.ClientModel;
  private _selectedModelId?: string;

  static readonly instance = new ModelRegistry();

  private constructor() {
    // no-op
  }

  private defaultModel() {
    // Initialize the model registry with the default configuration from the environment.
    const defaultConfig = getLLMConfiguration();
    if (defaultConfig.model) {
      return {
        id: defaultConfig.model,
        provider: defaultConfig.provider,
        name: defaultConfig.model,
        baseUrl: defaultConfig.baseUrl,
        createdAt: new Date().toISOString(),
      };
    }
  }

  select(modelId: string | undefined) {
    if (!modelId) {
      if (verbose()) console.log(`[ModelRegistry] Unselecting active model`);
      this._selectedModel = undefined;
      return;
    }

    let provider: string | undefined;
    let id: string;
    const lowerModelId = modelId.toLowerCase();
    const delimiterIndex = lowerModelId.indexOf(':');
    if (delimiterIndex === -1) {
      id = decodeURIComponent(lowerModelId.toLowerCase());
    } else {
      id = decodeURIComponent(lowerModelId.slice(delimiterIndex + 1));
      provider = decodeURIComponent(lowerModelId.slice(0, delimiterIndex));
    }

    let model = findModel(this.apiModels, id, provider);
    model = model ?? findModel(Array.from(this.clientModels.values()), id, provider);
    if (model && model !== this.selectedModel) {
      console.log(`[ModelRegistry] Selecting model "${modelId}"`);
    } else if (!model) {
      this._selectedModelId = modelId;
      return;
    }

    this._selectedModel = model;
  }

  get selectedModel(): NavieRpc.V1.Models.ClientModel | undefined {
    return this._selectedModel ?? this.defaultModel();
  }

  add(model: NavieRpc.V1.Models.ClientModel) {
    const key = `${model.provider.toLowerCase()}:${model.id.toLowerCase()}`;
    this.clientModels.set(key, model);
    this.onUpdateModels();
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
      .concat(this.apiModels)
      .map((m) => ({ ...m })); // shallow copy to avoid mutating the original objects

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

    this.onUpdateModels();
  }

  private onUpdateModels() {
    this.trySelectModel();
  }

  private trySelectModel() {
    if (this.selectedModel || !this._selectedModelId) return;

    this.select(this._selectedModelId);
    if (this.selectedModel) {
      this._selectedModelId = undefined;
    }
  }
}

import { NavieRpc } from '@appland/rpc';
import { normalizeDate } from '../util';

interface OpenAiModelResponse {
  object: 'list';
  data: {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
  }[];
}

const EXCLUDED_MODELS_REGEX =
  /preview|embedding|tts|moderation|dall-e|chatgpt|transcribe|image|\d{3,}/g;

export async function fetchOpenAIModels(apiKey: string): Promise<NavieRpc.V1.Models.Model[]> {
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
      model.owned_by !== 'system' || !model.id.match(EXCLUDED_MODELS_REGEX);

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

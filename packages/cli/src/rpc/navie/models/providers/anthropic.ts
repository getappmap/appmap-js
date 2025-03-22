import { NavieRpc } from '@appland/rpc';
import { normalizeDate } from '../util';

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

export async function fetchAnthropicModels(apiKey: string): Promise<NavieRpc.V1.Models.Model[]> {
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

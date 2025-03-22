import { OLLAMA_URL } from '@appland/navie';
import { NavieRpc } from '@appland/rpc';
import { verbose } from '../../../../utils';
import { normalizeDate } from '../util';

interface OllamaModelResponse {
  models: {
    name: string;
    modified_at: string;
  }[];
}

export async function fetchOllamaModels(): Promise<NavieRpc.V1.Models.Model[]> {
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

import { warn } from 'console';
import { Stats } from 'fs';
import { stat } from 'fs/promises';

export default function collectAppMapSize(appmapSizeInBytes: Record<string, number>) {
  return async (appmap: string) => {
    let stats: Stats;
    try {
      stats = await stat(appmap);
    } catch (e) {
      warn(`Error reading stats for ${appmap}: ${e}`);
      return;
    }

    appmapSizeInBytes[appmap] = stats.size;
  };
}

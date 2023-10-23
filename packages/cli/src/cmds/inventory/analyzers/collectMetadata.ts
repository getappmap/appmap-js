import { Metadata } from '@appland/models';
import readIndexFile from '../readIndexFile';

export default function collectMetadata(appmapCountByRecorderName: Record<string, number>) {
  return async (appmap: string) => {
    const metadata: Metadata = await readIndexFile(appmap, 'metadata.json');
    if (!metadata) return;

    const recorderName = metadata.recorder?.name || 'unknown';
    if (!appmapCountByRecorderName[recorderName]) appmapCountByRecorderName[recorderName] = 1;
    else appmapCountByRecorderName[recorderName] = appmapCountByRecorderName[recorderName] + 1;
  };
}

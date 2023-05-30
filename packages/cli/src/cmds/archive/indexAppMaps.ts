import Fingerprinter from '../../fingerprint/fingerprinter';
import { processFiles } from '../../utils';
import { CountNumProcessed } from './CountNumProcessed';
import reportAppMapProcessingError from './reportAppMapProcessingError';

export async function indexAppMaps(
  appmapDir: string,
  maxAppMapSizeInBytes: number
): Promise<number> {
  const handler = new Fingerprinter();
  handler.maxFileSizeInBytes = maxAppMapSizeInBytes;

  const counter = new CountNumProcessed();
  await processFiles(
    `${appmapDir}/**/*.appmap.json`,
    async (appmapFile) => await handler.fingerprint(appmapFile),
    counter.setCount(),
    reportAppMapProcessingError('Index')
  );

  return counter.count;
}

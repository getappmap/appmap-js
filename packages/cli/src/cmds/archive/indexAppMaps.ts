import Fingerprinter from '../../fingerprint/fingerprinter';
import { ProcessFileOptions, processFiles } from '../../utils';
import { CountNumProcessed } from './CountNumProcessed';
import reportAppMapProcessingError from './reportAppMapProcessingError';

export async function indexAppMaps(
  appmapDir: string,
  maxAppMapSizeInBytes: number
): Promise<number> {
  const handler = new Fingerprinter();
  handler.maxFileSizeInBytes = maxAppMapSizeInBytes;

  const counter = new CountNumProcessed();
  const options = new ProcessFileOptions();
  options.fileCountFn = counter.setCount();
  options.errorFn = reportAppMapProcessingError('Index');
  await processFiles(
    appmapDir,
    '.appmap.json',
    async (appmapFile) => await handler.fingerprint(appmapFile),
    options
  );

  return counter.count;
}

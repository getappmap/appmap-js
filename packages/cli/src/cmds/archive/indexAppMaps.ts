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
  const options = new ProcessFileOptions(appmapDir);
  options.fileCountFn = counter.setCount();
  options.errorFn = reportAppMapProcessingError('Index');
  await processFiles(
    '**/*.appmap.json',
    async (appmapFile) => await handler.fingerprint(appmapFile),
    options
  );

  return counter.count;
}

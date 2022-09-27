import { listAppMapFiles, verbose } from '../../../utils';

export default async function countAppMaps(appMapDir: string): Promise<number> {
  let fileCount = 0;

  // This function is too verbose to be useful in this context.
  const v = verbose();
  verbose(false);
  await listAppMapFiles(appMapDir, () => { fileCount += 1; });
  verbose(v);

  return fileCount;
}

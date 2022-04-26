import { listAppMapFiles, verbose } from '../../../utils';
import UI from '../../userInteraction';

export default async function printAppMapCount(appMapDir: string) {
  let fileCount = 0;

  // This function is too verbose to be useful in this context.
  const v = verbose();
  verbose(false);
  await listAppMapFiles(appMapDir, (_fileName: string) => (fileCount += 1));
  verbose(v);

  UI.progress(
    `There are now ${fileCount} AppMap files in directory ${appMapDir}`
  );
}

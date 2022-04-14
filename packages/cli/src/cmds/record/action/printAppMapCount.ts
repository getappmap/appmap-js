import { listAppMapFiles } from '../../../utils';
import UI from '../../userInteraction';

export default async function printAppMapCount(appMapDir: string) {
  let fileCount = 0;

  await listAppMapFiles(appMapDir, (_fileName: string) => (fileCount += 1));

  UI.progress(`Found ${fileCount} AppMap files.`);
}

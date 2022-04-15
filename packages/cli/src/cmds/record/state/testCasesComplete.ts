import printAppMapCount from '../action/printAppMapCount';
import { readConfig } from '../configuration';

export default async function testCasesComplete(): Promise<undefined> {
  const appMapDir = (await readConfig())?.appmap_dir;

  await printAppMapCount(appMapDir || '.');

  return;
}

import { verbose } from '../../../utils';
import printAppMapCount from '../action/printAppMapCount';
import { readConfig } from '../configuration';

export default async function testCasesComplete(): Promise<undefined> {
  const appMapDir = (await readConfig())?.appmap_dir;

  const v = verbose();

  // This function is too verbose to be useful in this context.
  verbose(false);
  await printAppMapCount(appMapDir || '.');
  verbose(v);

  return;
}

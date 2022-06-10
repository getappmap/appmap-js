import { loadConfig } from '../../configuration/configurationProvider';
import Configuration from '../../configuration/types/configuration';
import { collectAppMapFiles } from '../../rules/lib/util';
import validateFile from '../validateFile';
import ScanContext from './ui/scanContext';
import { State } from './ui/state';
import initial from './ui/state/initial';

type InteractiveScanOptions = {
  configuration: Configuration;
  appmapFile?: string | string[];
  appmapDir?: string;
};

export default async function interactiveScan(options: InteractiveScanOptions): Promise<void> {
  const { appmapFile, appmapDir, configuration } = options;

  const checks = await loadConfig(configuration);
  const files = await collectAppMapFiles(appmapFile, appmapDir);
  await Promise.all(files.map(async (file) => validateFile('file', file)));

  const context = new ScanContext(checks, files);

  let state: State | undefined = initial;
  while (state) {
    const newState: State | undefined = await state(context);
    state = newState;
  }
}

import { Arguments, Argv } from 'yargs';
import { readFile } from 'fs/promises';

import { create as createScannerJob } from '../../integration/appland/scannerJob/create';
import { ScanResults } from '../../report/scanResults';
import { verbose } from '../../rules/lib/util';

import validateFile from '../validateFile';

import CommandOptions from './options';
import resolveAppId from '../resolveAppId';
import reportUploadURL from '../reportUploadURL';

export default {
  command: 'upload',
  describe: 'Upload Findings to the AppMap Server',
  builder(args: Argv): Argv {
    args.option('appmap-dir', {
      describe: 'base directory of AppMaps',
      alias: 'd',
    });
    args.option('report-file', {
      describe: 'file containing the findings report',
      default: 'appland-findings.json',
    });
    args.option('app', {
      describe:
        'name of the app to publish the findings for. By default, this is determined by looking in appmap.yml',
    });
    args.option('merge-key', {
      describe: 'build job identifier. This is used to merge findings from parallelized scans',
    });
    return args.strict();
  },
  async handler(options: Arguments): Promise<void> {
    const {
      verbose: isVerbose,
      reportFile,
      appmapDir,
      app: appIdArg,
      mergeKey,
    } = options as unknown as CommandOptions;

    if (isVerbose) {
      verbose(true);
    }

    if (appmapDir) await validateFile('directory', appmapDir!);
    const appId = await resolveAppId(appIdArg, appmapDir);

    const scanResults = JSON.parse((await readFile(reportFile)).toString()) as ScanResults;
    const uploadResponse = await createScannerJob(scanResults, appId, mergeKey);

    reportUploadURL(uploadResponse.summary.numFindings, uploadResponse.url);
  },
};

import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { readFile, writeFile } from 'fs/promises';
import { warn } from 'console';
import { cwd } from 'process';
import { join } from 'path';
import { Report } from '../inventory/Report';
import assert from 'assert';
import loadAppMapConfig from '../../lib/loadAppMapConfig';
import buildReporter from './Reporter';

export default async function handler(argv: any) {
  verbose(argv.verbose);
  const { directory } = argv;
  handleWorkingDirectory(directory);

  const { reportJsonFile, outputFile, templateName, appmapUrl, sourceUrl } = argv;
  assert(reportJsonFile);
  assert(templateName);

  const appmapConfig = await loadAppMapConfig();
  if (!appmapConfig) throw new Error('Unable to load appmap.yml');

  const report: Report = JSON.parse(await readFile(reportJsonFile, 'utf-8'));

  const reporter = buildReporter(templateName, appmapUrl, sourceUrl);
  const reportMD = await reporter.generateReport(report, appmapConfig);
  if (outputFile) {
    await writeFile(outputFile, reportMD);
    warn(`Report written to ${join(cwd(), outputFile)}`);
  } else {
    console.log(reportMD);
  }
}

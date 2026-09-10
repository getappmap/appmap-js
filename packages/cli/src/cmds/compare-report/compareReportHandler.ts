import { readFile, writeFile } from 'fs/promises';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { verbose } from '../../utils';
import { ChangeReport } from '../compare/ChangeReport';
import ChangeReporter from './ChangeReporter';

export default async function handler(argv: any) {
  verbose(argv.verbose);
  const { directory, includeSection: includeSections, excludeSection: excludeSections } = argv;
  handleWorkingDirectory(directory);

  const { reportDirectory, sourceUrl, appmapUrl } = argv;
  process.chdir(reportDirectory);

  const makeArray = (arg: string): string[] => {
    if (Array.isArray(arg)) return arg;

    return [arg];
  };

  const report = JSON.parse(await readFile('change-report.json', 'utf-8')) as ChangeReport;
  const mdReport = new ChangeReporter(appmapUrl, sourceUrl);
  if (includeSections) mdReport.includeSections = makeArray(includeSections);
  if (excludeSections) mdReport.excludeSections = makeArray(excludeSections);

  const reportMD = await mdReport.generateReport(report);
  await writeFile('report.md', reportMD);
}

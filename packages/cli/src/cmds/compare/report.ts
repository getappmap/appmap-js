import { readFile } from 'fs/promises';
import yargs from 'yargs';
import { verbose } from '../../utils';
import { ChangeReport } from './ChangeReport';

export const command = 'compare-report <report-directory>';
export const describe = 'Generate a comparison report';

export const builder = (args: yargs.Argv) => {
  args.positional('report-directory', {
    describe: 'directory containing the comparison data',
    type: 'string',
    demandOption: true,
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);

  const { reportDirectory } = argv;
  process.chdir(reportDirectory);

  const report = JSON.parse(await readFile('compare-report.json', 'utf-8')) as ChangeReport;

  const outputFile = 'compare-report.md';
};

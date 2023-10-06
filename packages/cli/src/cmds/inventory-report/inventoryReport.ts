import yargs from 'yargs';
import { verbose } from '../../utils';
import { handleWorkingDirectory } from '../../lib/handleWorkingDirectory';
import { readFile, writeFile } from 'fs/promises';
import generateReport from './MarkdownReport';
import { warn } from 'console';
import { cwd } from 'process';
import { join } from 'path';

export const command = 'inventory-report <report-json-file> [output-file]';
export const describe = 'Generate a report document describing the current state of a repository.';

export const builder = (args: yargs.Argv) => {
  args.positional('report-json-file', {
    type: 'string',
    describe: `JSON report file to read. This file is generated by the 'inventory' command.`,
    demandOption: true,
  });

  args.positional('template-name', {
    type: 'string',
    describe: `Template name.`,
    default: 'default',
    choices: ['default', 'welcome'],
    alias: 't',
  });

  args.positional('output-file', {
    type: 'string',
    describe: `Markdown output file. If not specified, the report is written to stdout.`,
    demandOption: true,
  });

  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  return args.strict();
};

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  const { directory } = argv;
  handleWorkingDirectory(directory);

  const { reportJsonFile, outputFile, templateName } = argv;

  const report = JSON.parse(await readFile(reportJsonFile, 'utf-8'));

  const reportMD = await generateReport(templateName, report);
  if (outputFile) {
    await writeFile(outputFile, reportMD);
    warn(`Report written to ${join(cwd(), outputFile)}`);
  } else {
    console.log(reportMD);
  }
};
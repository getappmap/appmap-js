import yargs from 'yargs';

export default function fail(numFindings: number): void {
  if (numFindings > 0) {
    yargs.exit(1, new Error(`${numFindings} findings`));
  }
}

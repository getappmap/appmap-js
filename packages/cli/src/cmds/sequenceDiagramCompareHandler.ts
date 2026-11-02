import { basename, dirname, join } from 'path';
import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';
import { buildComparisonBundle } from './sequenceComparison/buildBundle';
import { refuseInputAlias, writeComparison } from './sequenceComparison/output';

type Arguments = {
  baseAppmap: string;
  headAppmap: string;
  directory?: string;
  verbose?: boolean;
  outputFile?: string;
  outputDir?: string;
  loops?: boolean;
  expand?: string;
  scenario?: string;
  baseRevision?: string;
  headRevision?: string;
};
export default async function handler(argv: any): Promise<void> {
  const args = argv as Arguments;
  verbose(args.verbose);
  handleWorkingDirectory(args.directory);
  const { baseAppmap: base, headAppmap: head } = args;
  const output =
    args.outputFile ||
    join(
      args.outputDir || dirname(head),
      `${basename(head, '.appmap.json')}.compare.diff.sequence.json`
    );
  const inputs = [base, head];
  await refuseInputAlias(output, inputs);
  const bundle = await buildComparisonBundle(base, head, args);
  await writeComparison(output, inputs, JSON.stringify(bundle, null, 2));
  console.log(`Printed comparison bundle ${output}`);
}

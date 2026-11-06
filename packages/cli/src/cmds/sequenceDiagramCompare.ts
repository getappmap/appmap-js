import type yargs from 'yargs';
import lazyHandler from '../lib/lazyHandler';
import type { ComparisonOptions, SequenceComparisonBundle } from './sequenceComparison/buildBundle';
export type { SequenceComparisonBundle } from './sequenceComparison/buildBundle';
export type { ComparisonSequenceView as SequenceComparisonView } from '@appland/models';

export const command = 'sequence-diagram-compare <base-appmap> <head-appmap>';
export const describe = 'Create a portable before/after/overlay sequence comparison bundle';

export const builder = (args: yargs.Argv) => {
  args.positional('base-appmap', {
    describe: 'AppMap recorded before the change',
    type: 'string',
    demandOption: true,
  });
  args.positional('head-appmap', {
    describe: 'AppMap recorded after the change',
    type: 'string',
    demandOption: true,
  });
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('output-file', {
    describe: 'comparison bundle file to write',
    type: 'string',
  });
  args.option('output-dir', {
    describe: 'directory in which to write the comparison bundle',
    type: 'string',
  });
  args.option('scenario', {
    describe: 'stable scenario id shown by comparison viewers',
    type: 'string',
  });
  args.option('base-revision', {
    describe: 'base Git revision recorded in the bundle',
    type: 'string',
  });
  args.option('head-revision', {
    describe: 'head Git revision recorded in the bundle',
    type: 'string',
  });
  args.option('loops', {
    describe: 'identify loops and collect them under Loop objects',
    type: 'boolean',
    default: true,
  });
  args.option('expand', {
    describe: 'code objects to expand in all three diagrams',
    type: 'string',
  });

  return args.strict();
};

// Compatibility API: importing command metadata must not import the producer.
export async function buildComparisonBundle(
  base: string,
  head: string,
  options: ComparisonOptions = {}
): Promise<SequenceComparisonBundle> {
  const producer = await import('./sequenceComparison/buildBundle');
  return producer.buildComparisonBundle(base, head, options);
}

export const handler = lazyHandler(() => import('./sequenceDiagramCompareHandler'));

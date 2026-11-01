import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';
import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';

// ## 1.3.0
//
// * AppMap scanner is run on all AppMaps, with an appmap-findings.json file stored in each index directory.
//
// ## 1.2.0
//
// * Update format of compare fliters.
//
// ## 1.1.1
//
// * SQL actions in sequence diagram - digest is a fixed value if the SQL string is truncated.
//
// ## 1.1.0
//
// * Added appMapFilter to the archive metadata.
export const ArchiveVersion = '1.3.0';

export const PackageVersion = {
  name: '@appland/appmap',
  version: process.env.npm_package_version,
};

export const command = 'archive';
export const describe = 'Build an AppMap archive from a directory containing AppMaps';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('type', {
    describe: 'archive type',
    choices: ['full', 'incremental', 'auto'],
    default: 'auto',
    alias: 't',
  });

  args.option('revision', {
    describe: `revision identifier.
    
If not explicitly specified, the current git revision will be used.
When this command is used in an CI server, it's best to explicitly the provide the revision
from an environment variable provided by the CI system, such as GITHUB_HEAD_SHA, because the
commit of the current git revision may not be the one that triggered the build.`,
    type: 'string',
    alias: 'r',
  });

  args.option('output-dir', {
    describe: `directory in which to save the output file. By default, it's .appmap/archive/<type>.`,
    type: 'string',
  });

  args.option('output-file', {
    describe: 'output file name. Default output name is <revision>.tar',
    type: 'string',
    alias: 'f',
  });

  args.option('analyze', {
    describe: 'whether to analyze the AppMaps',
    type: 'boolean',
    alias: 'index',
    default: true,
  });

  args.option('max-size', {
    describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
    default: DefaultMaxAppMapSizeInMB,
  });

  args.option('filter', {
    describe: 'filter to apply to AppMaps when normalizing them into sequence diagrams',
    type: 'string',
    multiple: true,
  });

  args.option('thread-count', {
    describe: 'Number of worker threads to use when analyzing AppMaps',
    type: 'number',
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./archiveHandler'));

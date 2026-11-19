import yargs from 'yargs';
import lazyHandler from '../../lib/lazyHandler';

export const command = 'compare';
export const describe = 'Compare runtime code behavior between base and head revisions';

export const builder = (args: yargs.Argv) => {
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });

  args.option('base-revision', {
    describe:
      'base revision name or commit SHA. Required unless --base-archive is given, in which case the default is the revision stored in the archive.',
    type: 'string',
    alias: ['b', 'base'],
  });
  args.option('head-revision', {
    describe:
      'head revision name or commit SHA. By default, use the current commit, or the revision stored in --head-archive.',
    type: 'string',
    alias: ['h', 'head'],
  });

  args.option('base-archive', {
    describe: `AppMap archive (.tar, made by 'appmap archive') of the base revision. It is restored into <output-dir>/base.
Must be given together with --head-archive. In this mode appmap.yml is not required.`,
    type: 'string',
  });
  args.option('head-archive', {
    describe: `AppMap archive (.tar, made by 'appmap archive') of the head revision. It is restored into <output-dir>/head.`,
    type: 'string',
  });

  args.option('expand', {
    describe: `code objects to expand into one lane per child (for example package:app/models) in the sequence diagrams of both revisions before they are compared.
See the sequence-diagram command. The diagrams are rebuilt from the AppMaps in <output-dir>/base and <output-dir>/head.`,
    type: 'string',
    array: true,
  });

  args.option('output-dir', {
    describe:
      'directory in which to save the report files. Default is ./.appmap/change-report/<base-revision>-<head-revision>.',
  });

  args.option('clobber-output-dir', {
    describe:
      'remove the existing diff directory without asking. With --base-archive and --head-archive, also remove existing base and head directories.',
    type: 'boolean',
    default: false,
  });

  args.option('source-dir', {
    describe: 'root directory of the application source code',
    type: 'string',
    default: '.',
  });

  args.option('delete-unreferenced', {
    describe:
      'whether to delete AppMaps from base and head that are unreferenced by the change report',
    default: true,
    alias: 'delete-unchanged',
  });

  args.option('report-removed', {
    describe:
      'whether to report removed findings, such as removed API routes, resolved findings, etc',
    default: true,
  });

  return args.strict();
};

export const handler = lazyHandler(() => import('./compareHandler'));

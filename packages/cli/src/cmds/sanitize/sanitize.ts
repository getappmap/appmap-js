import Yargs from 'yargs';

import lazyHandler from '../../lib/lazyHandler';

export default {
  command: 'sanitize <files..>',

  describe:
    'Replace captured values in AppMaps with per-file equality-preserving tokens, so the files cannot carry secrets',

  builder: (args: Yargs.Argv) => {
    args.positional('files', {
      describe: 'AppMap file(s) to sanitize',
      type: 'string',
    });

    args.option('allow', {
      describe:
        'Value to keep verbatim (repeatable). Exact whole-value match; meant for small public vocabularies such as state or role names',
      type: 'array',
      default: [],
    });

    args.option('allow-file', {
      describe: 'File of values to keep verbatim, one per line (# comments and blank lines skipped)',
      type: 'string',
    });

    args.option('output-dir', {
      describe: 'Write sanitized AppMaps here (default: overwrite each file in place)',
      type: 'string',
      alias: 'o',
    });

    args.option('directory', {
      describe: 'Working directory for the command',
      type: 'string',
      alias: 'd',
    });

    return args;
  },

  handler: lazyHandler(() => import('./sanitizeHandler')),
};

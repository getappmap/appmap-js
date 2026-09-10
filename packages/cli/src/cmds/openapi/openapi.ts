import { Argv } from 'yargs';

import { DefaultMaxAppMapSizeInMB } from '../../lib/fileSizeFilter';
import lazyHandler from '../../lib/lazyHandler';

export type FilterFunction = (file: string) => Promise<{ enable: boolean; message?: string }>;

export default {
  command: 'openapi',
  aliases: ['swagger'],
  describe: 'Generate OpenAPI from AppMaps in a directory',
  builder(args: Argv) {
    args.option('directory', {
      describe: 'program working directory',
      type: 'string',
      alias: 'd',
    });
    args.option('appmap-dir', {
      describe: 'directory to recursively inspect for AppMaps',
    });
    args.option('max-size', {
      describe: 'maximum AppMap size that will be processed, in filesystem-reported MB',
      type: 'number',
      default: DefaultMaxAppMapSizeInMB,
    });
    args.option('output-file', {
      alias: ['o'],
      describe: 'output file name',
      requiresArg: true,
    });
    args.option('openapi-template', {
      describe:
        'template YAML; generated content will be placed in the paths and components sections',
    });
    args.option('openapi-title', {
      describe: 'info/title field of the OpenAPI document',
    });
    args.option('openapi-version', {
      describe: 'info/version field of the OpenAPI document',
    });
    return args.strict();
  },
  handler: lazyHandler(() => import('./openapiHandler')),
};

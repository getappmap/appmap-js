import lazyHandler from '../../lib/lazyHandler';

export const command = 'open [appmap-file]';
export const describe = 'Open an AppMap in the system default browser';

export const builder = (args) => {
  args.positional('appmap-file', {
    describe: 'path to the AppMap to open.',
    type: 'string',
    default: undefined,
  });
  return args.strict();
};

export const handler = lazyHandler(() => import('./openHandler'));

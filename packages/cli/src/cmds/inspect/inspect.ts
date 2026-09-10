import lazyHandler from '../../lib/lazyHandler';

export const command = 'inspect <code-object>';
export const describe =
  'Search AppMaps for references to a code object (package, function, class, query, route, etc) and print available event info';

export const builder = (args) => {
  args.positional('code-object', {
    describe: 'identifies the code-object to inspect',
  });
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('appmap-dir', {
    describe: 'directory to recursively inspect for AppMaps',
  });
  args.option('interactive', {
    describe: 'interact with the output via CLI',
    alias: 'i',
    boolean: true,
  });
  return args.strict();
};

export const handler = lazyHandler(() => import('./inspectHandler'));

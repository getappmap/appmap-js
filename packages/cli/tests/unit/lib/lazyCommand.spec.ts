import yargs from 'yargs';

import lazyCommand from '../../../src/lib/lazyCommand';

describe('lazyCommand', () => {
  const builder = jest.fn((args: ReturnType<typeof yargs>) =>
    args.option('flag', { type: 'string' })
  );
  const handler = jest.fn();
  const load = jest.fn(() => ({
    command: 'thing [name]',
    describe: 'Do the thing',
    builder,
    handler,
  }));

  const parser = () =>
    yargs()
      .command(lazyCommand({ command: 'thing [name]', describe: 'Do the thing', load }))
      .exitProcess(false)
      .help();

  afterEach(() => jest.clearAllMocks());

  it('does not load the module to register the command or list it in help', async () => {
    const help = await parser().getHelp();
    expect(help).toContain('thing [name]');
    expect(help).toContain('Do the thing');
    expect(load).not.toHaveBeenCalled();
  });

  it('loads the module once and delegates builder and handler on dispatch', async () => {
    const argv = await parser().parseAsync(['thing', 'widget', '--flag', 'on']);
    expect(load).toHaveBeenCalledTimes(1);
    expect(builder).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({ name: 'widget', flag: 'on' });
    expect(argv).toMatchObject({ name: 'widget', flag: 'on' });
  });

  it('applies an object builder as options', async () => {
    const objectHandler = jest.fn();
    const objectLoad = jest.fn(() => ({
      command: 'other',
      describe: 'Other thing',
      builder: { count: { type: 'number' } },
      handler: objectHandler,
    }));
    await yargs()
      .command(lazyCommand({ command: 'other', describe: 'Other thing', load: objectLoad }))
      .exitProcess(false)
      .parseAsync(['other', '--count', '3']);
    expect(objectLoad).toHaveBeenCalledTimes(1);
    expect(objectHandler.mock.calls[0][0]).toMatchObject({ count: 3 });
  });

  it('accepts a module exported as default', async () => {
    const defaultHandler = jest.fn();
    const defaultLoad = jest.fn(() => ({
      default: { command: 'third', describe: 'Third thing', handler: defaultHandler },
    }));
    await yargs()
      .command(lazyCommand({ command: 'third', describe: 'Third thing', load: defaultLoad }))
      .exitProcess(false)
      .parseAsync(['third']);
    expect(defaultHandler).toHaveBeenCalledTimes(1);
  });
});

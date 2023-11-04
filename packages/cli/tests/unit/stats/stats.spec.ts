import path from 'path';
import StatsCommand from '../../../src/cmds/stats/stats';
import { withStubbedTelemetry } from '../../helper';
import { EventInfo } from '../../../src/cmds/stats/accumulateEvents';

const fixtureDir = path.join(__dirname, '../', 'fixtures', 'stats');
const mapPath = path.join('Microposts_interface_micropost_interface.appmap.json');

const relativeMapPath = path.join('appmap', 'Microposts_interface_micropost_interface.appmap.json');
const originalDir = process.cwd();

describe('stats subcommand', () => {
  withStubbedTelemetry();

  afterEach(() => process.chdir(originalDir));

  const commonArgs = {
    _: ['stats'],
    $0: 'src/cli.ts',
    directory: fixtureDir,
    appmapDir: 'appmap',
  };

  it('analyzes a directory', async () => {
    const argv = { ...commonArgs };

    const ret = await StatsCommand.handler(argv);
    if (!ret) throw Error();
    const [biggestAppMapSizes, slowestExecutionTimes] = ret;
    expect(biggestAppMapSizes[0].size).toEqual(1747637);
    expect(slowestExecutionTimes[0].elapsed_instrumentation_time_total).toEqual(0.020088);
    expect(slowestExecutionTimes[0].num_calls).toEqual(449);
    expect(slowestExecutionTimes[0].name).toEqual('function:logger/Logger::LogDevice#write');
  });

  it('analyzes an appmap absolute path', async () => {
    let argv = {
      ...commonArgs,
      appmapFile: path.resolve(fixtureDir, relativeMapPath),
      limit: 10,
    };

    const ret = await StatsCommand.handler(argv);
    if (!ret) throw Error();
    expect(ret.length).toEqual(argv.limit);
    const { function: fn, count, size } = ret[0] as EventInfo;
    expect(fn).toEqual('function:logger/Logger::LogDevice#write');
    expect(count).toEqual(319);
    expect(size).toEqual(172419);
  });

  it('analyzes a file in the current working directory', async () => {
    const argv = {
      ...commonArgs,
      directory: path.join(fixtureDir, 'appmap'),
      appmapFile: mapPath,
    };

    const ret = await StatsCommand.handler(argv);
    if (!ret) throw Error();
    expect(ret.length).toEqual(75);
    const { function: fn, count, size } = ret[0] as EventInfo;
    expect(fn).toEqual('function:logger/Logger::LogDevice#write');
    expect(count).toEqual(319);
    expect(size).toEqual(172419);
  });

  it('handles and analyzes relative file paths correctly', async () => {
    const argv = {
      ...commonArgs,
      appmapFile: relativeMapPath,
    };

    const ret = await StatsCommand.handler(argv);
    if (!ret) throw Error();
    expect(ret.length).toEqual(75);
    const { function: fn, count, size } = ret[0] as EventInfo;
    expect(fn).toEqual('function:logger/Logger::LogDevice#write');
    expect(count).toEqual(319);
    expect(size).toEqual(172419);
  });

  it('does not analyze a file in a child directory when only a file name is passed', async () => {
    const argv = {
      ...commonArgs,
      directory: originalDir,
      appmapFile: mapPath,
    };

    const ret = await StatsCommand.handler(argv);
    expect(ret).toBeUndefined();
  });
});

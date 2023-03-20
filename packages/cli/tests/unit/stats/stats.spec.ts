import path from 'path';
import { EventInfo } from '../../../src/cmds/stats/directory/statsForMap';
import StatsCommand from '../../../src/cmds/stats/stats';
import { withStubbedTelemetry } from '../../helper';

const fixtureDir = path.join(__dirname, '../', 'fixtures', 'stats');
const mapPath = path.join('Microposts_interface_micropost_interface.appmap.json');

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

  it('analyzes an appmap', async () => {
    let argv = {
      ...commonArgs,
      appmapFile: mapPath,
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
});

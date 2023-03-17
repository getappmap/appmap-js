import path from 'path';
import { EventInfo } from '../../../src/cmds/stats/directory/statsForMap';
import StatsCommand from '../../../src/cmds/stats/stats';
import { withStubbedTelemetry } from '../../helper';

const fixtureDir = path.join(__dirname, '../', 'fixtures', 'stats');
const mapPath = path.join(
  fixtureDir,
  'appmap',
  'Microposts_interface_micropost_interface.appmap.json'
);

const originalDir = process.cwd();

describe('stats subcommand', () => {
  withStubbedTelemetry();

  afterEach(() => process.chdir(originalDir));

  it('analyzes a directory', async () => {
    const argv = {
      _: ['stats'],
      $0: 'src/cli.ts',
      directory: fixtureDir,
      d: fixtureDir,
    };

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
      _: ['stats'],
      $0: 'src/cli.ts',
      ['appmap-file']: mapPath,
      appmapFile: mapPath,
      a: mapPath,
      limit: 10,
      l: 10,
      directory: '.',
      d: '.',
    };

    const ret = await StatsCommand.handler(argv);
    if (!ret) throw Error();
    expect(ret.length).toEqual(argv.limit);
    const { fqid, count, size } = ret[0] as EventInfo;
    expect(fqid).toEqual('function:logger/Logger::LogDevice#write');
    expect(count).toEqual(319);
    expect(size).toEqual(172419);
  });
});

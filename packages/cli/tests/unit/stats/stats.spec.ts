import path from 'path';
const fixtureDir = path.join(__dirname, '../', 'fixtures', 'stats');
const StatsCommand = require('../../../src/cmds/stats/stats');

import UI from '../../../src/cmds/userInteraction';

describe('stats subcommand', () => {
  it('works', async () => {
    let argv = {
      _: ['stats'],
      $0: 'src/cli.ts',
      directory: fixtureDir,
      d: fixtureDir,
    };

    let ret = await StatsCommand.handler(argv);
    //const {biggestAppMapSizes, slowestExecutionTimes} = await StatsCommand.handler(argv);
    // expect(biggestAppMapSizes[2]).toEqual(865345);
  });
});

import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import tmp from 'tmp';
import yargs from 'yargs';
import * as PruneAppMap from '../../src/cmds/prune/pruneAppMap';
const fixtureDir = path.join(__dirname, 'fixtures', 'ruby');
tmp.setGracefulCleanup();

describe('prune subcommand', () => {
  let projectDir: string;
  beforeEach(() => {
    projectDir = tmp.dirSync({} as any).name;
    fse.copySync(fixtureDir, projectDir);

  });

  afterEach(() => {
    sinon.restore();
  });

  it('works', async () => {
    const cmd = require('../../src/cmds/prune/prune').default;
    const parser = yargs.command(cmd);

    sinon.stub(PruneAppMap, 'pruneAppMap').returns({events:[]});

    const appMapFile = path.join(projectDir, 'revoke_api_key.appmap.json');
    const cmdLine = `prune -o ${projectDir} ${appMapFile} 2MB`;
    await new Promise((resolve, reject) => {
      parser.parse(cmdLine, {}, (err, argv, output) => {
        if (err) {
          reject(err);
        }
        else {
          resolve(output);
        }
      });
    });

    // Check that we wrote the output file correctly. Validity of pruning is
    // tested in @appland/models.
    const actual = fs.readFileSync(appMapFile)
    expect(actual.toString()).toEqual('{"events":[]}');
  });
});
import { base64UrlEncode } from '@appland/models';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import tmp, { file } from 'tmp';
import yargs from 'yargs';
import * as PruneAppMap from '../../src/cmds/prune/pruneAppMap';
const fixtureDir = path.join(__dirname, 'fixtures', 'ruby');
const cmd = require('../../src/cmds/prune/prune').default;
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
    const parser = yargs.command(cmd);

    sinon.stub(PruneAppMap, 'pruneAppMap').returns({ events: [], data: { exclusions: [] } });

    const appMapFile = path.join(projectDir, 'revoke_api_key.appmap.json');
    const cmdLine = `prune -o ${projectDir} ${appMapFile} 2MB`;
    await new Promise((resolve, reject) => {
      parser.parse(cmdLine, {}, (err, argv, output) => {
        if (err) {
          reject(err);
        } else {
          resolve(output);
        }
      });
    });

    // Check that we wrote the output file correctly. Validity of pruning is
    // tested in @appland/models.
    const actual = fs.readFileSync(appMapFile);
    expect(actual.toString()).toEqual('{"events":[],"data":{"exclusions":[]}}');
  });

  it('correctly reduces the size of an appmap from a base64url-encoded filter', async () => {
    const filterState = {
      hideName: [
        'function:logger/Logger::LogDevice#write',
        'function:activerecord/ActiveRecord::Relation#records',
        'function:actionpack/ActionDispatch::Request::Session#[]',
      ],
    };
    const serializedFilterState = base64UrlEncode(JSON.stringify(filterState));

    const appmapFile = path.join(
      __dirname,
      'fixtures',
      'stats',
      'appmap',
      'Microposts_interface_micropost_interface.appmap.json'
    );

    const argv = {
      file: appmapFile,
      filter: serializedFilterState,
      outputDir: projectDir,
    };
    await cmd.handler(argv);

    const outPath = path.join(projectDir, 'Microposts_interface_micropost_interface.appmap.json');
    const fileStats = fs.lstatSync(outPath);
    expect(fileStats.isFile);
    expect(fileStats.size).toEqual(740734);
  });
});

import { base64UrlEncode } from '@appland/models';
import fs from 'fs';
import fse from 'fs-extra';
import path from 'path';
import sinon from 'sinon';
import tmp from 'tmp';
import yargs from 'yargs';
import { fromFile } from '../../src/cmds/prune/prune';
import * as PruneAppMap from '../../src/cmds/prune/pruneAppMap';
const fixtureDir = path.join(__dirname, 'fixtures', 'ruby');
const cmd = require('../../src/cmds/prune/prune').default;
tmp.setGracefulCleanup();

const statsMapFile = path.join(
  __dirname,
  'fixtures',
  'stats',
  'appmap',
  'Microposts_interface_micropost_interface.appmap.json'
);

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

    sinon.stub(PruneAppMap, 'pruneAppMap').returns({ events: [], data: { pruneFilter: [] } });

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
    const actual = await fromFile(appMapFile);
    expect(JSON.stringify(actual)).toEqual('{"events":[],"data":{"pruneFilter":[]}}');
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

    const argv = {
      file: statsMapFile,
      filter: serializedFilterState,
      outputDir: projectDir,
    };
    await cmd.handler(argv);

    const outPath = path.join(projectDir, 'Microposts_interface_micropost_interface.appmap.json');
    const fileStats = fs.lstatSync(outPath);
    expect(fileStats.isFile()).toBe(true);
    expect(fileStats.size).toEqual(740735);
  });

  it('correctly combines pruneFilter data', async () => {
    const statsMapData = (await fromFile(statsMapFile)) as any;

    statsMapData.pruneFilter = {
      hideName: ['fakeNameOne', 'fakeNameTwo'],
      hideUnlabeled: true,
      hideElapsedTimeUnder: '10',
    };

    const newFilter = {
      hideName: [
        'function:logger/Logger::LogDevice#write',
        'function:activerecord/ActiveRecord::Relation#records',
        'function:actionpack/ActionDispatch::Request::Session#[]',
      ],
      hideElapsedTimeUnder: '50',
      hideMediaRequests: true,
    };

    const prunedMapData = PruneAppMap.pruneWithFilter(
      statsMapData,
      base64UrlEncode(JSON.stringify(newFilter))
    );

    const expectedFilter = {
      hideName: [
        'function:logger/Logger::LogDevice#write',
        'function:activerecord/ActiveRecord::Relation#records',
        'function:actionpack/ActionDispatch::Request::Session#[]',
        'fakeNameOne',
        'fakeNameTwo',
      ],
      hideElapsedTimeUnder: '50',
      hideUnlabeled: true,
      hideMediaRequests: true,
    };

    expect(prunedMapData.data.pruneFilter).toEqual(expectedFilter);
    delete statsMapData.pruneFilter;
  });

  it('indicates when a map has been automatically pruned', async () => {
    const filter = {
      hideName: [
        'function:logger/Logger::LogDevice#write',
        'function:activerecord/ActiveRecord::Relation#records',
        'function:actionpack/ActionDispatch::Request::Session#[]',
      ],
    };

    const serializedFilter = base64UrlEncode(JSON.stringify(filter));

    const argv = {
      file: statsMapFile,
      filter: serializedFilter,
      outputDir: projectDir,
      auto: true,
    };
    await cmd.handler(argv);

    const outPath = path.join(projectDir, 'Microposts_interface_micropost_interface.appmap.json');
    const prunedMapData = await fromFile(outPath);

    expect(prunedMapData.pruneFilter.auto).toBe(true);
  });

  it('does not write a file when --output-data is used', async () => {
    const mapName = 'revoke_api_key.appmap.json';
    const appMapFile = path.join(projectDir, mapName);
    const outputDir = path.join(projectDir, 'out');

    fs.mkdirSync(outputDir);

    const argv = {
      file: appMapFile,
      size: '5kb',
      outputData: true,
      outputDir,
    };

    await cmd.handler(argv);

    expect(fs.existsSync(path.join(outputDir, mapName))).toBe(false);
  });
});

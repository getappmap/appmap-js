const { utimesSync } = require('fs');
const { join } = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');

const Fingerprinter = require('../../src/fingerprint/fingerprinter');
const FindCodeObjects = require('../../src/search/findCodeObjects');
const { listAppMapFiles, verbose } = require('../../src/utils');

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, 'fixtures', 'ruby');
const appMapDir = tmp.dirSync().name;

const now = Date.now();

describe('Inspect', () => {
  beforeAll(async () => {
    if (process.env.DEBUG) {
      verbose(true);
    }

    fs.copySync(fixtureDir, appMapDir);

    const fingerprinter = new Fingerprinter(true);
    await listAppMapFiles(appMapDir, async (fileName) => {
      utimesSync(fileName, now, now);
      await fingerprinter.fingerprint(fileName);
    });
  });

  test('finds a named function', async () => {
    const fn = new FindCodeObjects(
      appMapDir,
      'function:app/models/ApiKey.issue'
    );
    const result = await fn.find();
    expect(JSON.stringify(result, null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: `${appMapDir}/revoke_api_key`,
            codeObject: {
              name: 'issue',
              type: 'function',
              labels: ['security'],
              static: true,
              location: 'app/models/api_key.rb:28',
            },
          },
        ],
        null,
        2
      )
    );
  });

  test('finds a named class', async () => {
    const fn = new FindCodeObjects(appMapDir, 'class:app/models/ApiKey');
    const result = await fn.find();
    expect(JSON.stringify(result, null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: `${appMapDir}/revoke_api_key`,
            codeObject: {
              name: 'ApiKey',
              type: 'class',
            },
          },
        ],
        null,
        2
      )
    );
  });

  test('finds a named package', async () => {
    const fn = new FindCodeObjects(appMapDir, 'package:app/models');
    const result = await fn.find();
    // FindCodeObjects.find may return appmaps in any order. Sort them so they'll match.
    result.sort((o1, o2) => o1.appmap.localeCompare(o2.appmap));
    expect(JSON.stringify(result, null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: `${appMapDir}/revoke_api_key`,
            codeObject: {
              name: 'app/models',
              type: 'package',
            },
          },
          {
            appmap: `${appMapDir}/user_page_scenario`,
            codeObject: {
              name: 'app/models',
              type: 'package',
            },
          },
        ],
        null,
        2
      )
    );
  });
});

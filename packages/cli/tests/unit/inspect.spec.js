const { utimesSync } = require('fs');
const { join } = require('path');
const Fingerprinter = require('../../src/fingerprint/fingerprinter');
const FindCodeObjects = require('../../src/search/findCodeObjects');
const { listAppMapFiles, verbose } = require('../../src/utils');

const appMapDir = join(__dirname, 'fixtures');
const now = Date.now();

describe('Inspect', () => {
  beforeAll(async () => {
    if (process.env.DEBUG) {
      verbose(true);
    }

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
            appmap: 'tests/unit/fixtures/revoke_api_key',
            codeObject: {
              name: 'issue',
              type: 'function',
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
});

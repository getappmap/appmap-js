import { utimesSync } from 'fs';
import { join } from 'path';
import tmp from 'tmp';
import fs from 'fs-extra';

import Fingerprinter from '../../src/fingerprint/fingerprinter';
import FindCodeObjects from '../../src/search/findCodeObjects';
import { listAppMapFiles, verbose } from '../../src/utils';
import { CodeObject, CodeObjectMatch } from '../../src/search/types';

tmp.setGracefulCleanup();

const fixtureDir = join(__dirname, 'fixtures', 'ruby');
const appMapDir = tmp.dirSync().name.replace(/\\/g, '/');

const now = new Date();

function stripCodeObjectParents(codeObjectMatches: CodeObjectMatch[]): CodeObjectMatch[] {
  const strip = (codeObject: CodeObject): void => {
    codeObject.parent = undefined;
    codeObject.children = undefined;
    (codeObject.children || []).forEach(strip);
  };
  codeObjectMatches.forEach((com) => strip(com.codeObject));
  return codeObjectMatches;
}

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
    const fn = new FindCodeObjects(appMapDir, 'function:app/models/ApiKey.issue');
    const result = await fn.find();
    expect(JSON.stringify(stripCodeObjectParents(result), null, 2)).toEqual(
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
              fqid: 'function:app/models/ApiKey.issue',
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
    expect(JSON.stringify(stripCodeObjectParents(result), null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: `${appMapDir}/revoke_api_key`,
            codeObject: {
              name: 'ApiKey',
              type: 'class',
              fqid: 'class:app/models/ApiKey',
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
    expect(JSON.stringify(stripCodeObjectParents(result), null, 2)).toEqual(
      JSON.stringify(
        [
          {
            appmap: `${appMapDir}/revoke_api_key`,
            codeObject: {
              name: 'app/models',
              type: 'package',
              fqid: 'package:app/models',
            },
          },
          {
            appmap: `${appMapDir}/user_page_scenario`,
            codeObject: {
              name: 'app/models',
              type: 'package',
              fqid: 'package:app/models',
            },
          },
        ],
        null,
        2
      )
    );
  });
});

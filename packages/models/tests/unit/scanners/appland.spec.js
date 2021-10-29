/* eslint-disable no-restricted-syntax */
import { join } from 'path';
import fs from 'fs';
import buildAppMap from '../../../src/appMapBuilder';
import applandScans from '../../../src/scanners/appland';

const appmapDir = join(__dirname, '..', 'fixtures');

describe('AppLand scanner', () => {
  test('all appmaps are valid', async () => {
    const fileNames = fs
      .readdirSync(appmapDir)
      .filter((filename) => filename.endsWith('.appmap.json'));
    const scans = applandScans();
    const scanners = fileNames.map(
      (filename) =>
        new Promise((resolve, reject) => {
          try {
            const appmapData = JSON.parse(
              fs.readFileSync(join(appmapDir, filename))
            );
            if (!appmapData.events) {
              resolve();
            }
            const appmap = buildAppMap().source(appmapData).normalize().build();
            const results = scans(appmap.events);
            resolve({ filename, results });
          } catch (e) {
            reject(e);
          }
        })
    );

    const allResults = await Promise.all(scanners);
    allResults
      .filter((result) => result)
      .forEach((result) => {
        const { filename, results } = result;
        results.forEach((entry) => {
          const { errors } = entry;
          if (errors.length === 0) {
            return;
          }
          console.log(filename);
          console.log(entry.scanner.toString());
          console.log(entry.targets.map((e) => e.toString()).join(', '));
          console.log(entry.matches.map((e) => e.toString()).join(', '));
          console.log(entry.errors.map((e) => e.toString()).join(', '));
        });
      });
  });
});

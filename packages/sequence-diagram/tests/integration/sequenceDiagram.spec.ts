import assert from 'assert';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from '../../src/formatter/plantUML';
import { APPMAPS, APP_APPMAP_DIR, loadDiagram } from '../util';

describe('Sequence diagram', () => {
  describe('PlantUML', () => {
    it('matches app fixture', async () => {
      for (const entry of Object.entries(APPMAPS)) {
        const [appmapFile, appmap] = entry;
        const diagram = loadDiagram(appmap, {
          priority: { 'package:lib/database': 10000 },
        });
        const plantUML = format(diagram, appmapFile);
        assert.strictEqual(
          plantUML,
          await readFile(
            join(APP_APPMAP_DIR, appmapFile.replace('.appmap.json', '.sequence.uml')),
            'utf-8'
          )
        );
      }
    });
  });
});

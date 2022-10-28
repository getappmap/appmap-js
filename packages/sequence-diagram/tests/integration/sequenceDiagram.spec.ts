import assert from 'assert';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { format } from '../../dist/formatter/plantUML';
import { APPMAPS, APPMAP_DIR, loadDiagram } from '../util';

describe('Sequence diagram', () => {
  describe('PlantUML', () => {
    it('matches fixture', async () => {
      for (const entry of Object.entries(APPMAPS)) {
        const [appmapFile, appmap] = entry;
        const diagram = loadDiagram(appmap, {
          priority: { 'package:lib/database': 10000 },
        });
        const plantUML = format(diagram, appmapFile);
        assert.strictEqual(
          plantUML,
          await readFile(
            join(APPMAP_DIR, appmapFile.replace('.appmap.json', '.sequence.uml')),
            'utf-8'
          )
        );
      }
    });
  });
});

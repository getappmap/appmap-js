import { join } from 'path';
import { format } from '../../src/formatter/plantUML';
import {
  APPMAPS,
  APP_APPMAP_DIR,
  SHOW_USER_APPMAP_FILE,
  checkPlantUMLEqual,
  loadDiagram,
} from '../util';

describe('Sequence diagram', () => {
  describe('PlantUML', () => {
    it('matches app fixture', async () => {
      for (const entry of Object.entries(APPMAPS)) {
        const [appmapFile, appmap] = entry;
        const diagram = loadDiagram(appmap);
        const plantUML = format(diagram, appmapFile);
        await checkPlantUMLEqual(
          plantUML,
          join(APP_APPMAP_DIR, appmapFile.replace('.appmap.json', '.sequence.uml'))
        );
      }
    });
    it('colorization and notes can be disabled', async () => {
      const appmapFile = SHOW_USER_APPMAP_FILE;
      const appmap = APPMAPS[appmapFile];
      const diagram = loadDiagram(appmap);
      const plantUML = format(diagram, appmapFile, { disableMarkup: true, disableNotes: true });
      await checkPlantUMLEqual(
        plantUML,
        join(APP_APPMAP_DIR, appmapFile.replace('.appmap.json', '.plain.sequence.uml'))
      );
    });
  });
});

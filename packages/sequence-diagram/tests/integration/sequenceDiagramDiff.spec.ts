import diff from '../../src/diff';
import buildDiffDiagram from '../../src/buildDiffDiagram';
import {
  FIXTURE_DIR,
  LIST_USERS_APPMAP,
  LIST_USERS_PREFETCH_APPMAP,
  loadDiagram,
  SHOW_USER_APPMAP,
  USER_NOT_FOUND_APPMAP,
  VERBOSE,
  checkPlantUMLEqual,
  checkTextEqual,
} from '../util';
import { join } from 'path';
import format from '../../src/formatter';
import { FormatType } from '../../src/types';

describe('Sequence diagram diff', () => {
  describe('PlantUML', () => {
    describe('user found vs not found', () => {
      const baseDiagram = loadDiagram(USER_NOT_FOUND_APPMAP);
      const headDiagram = loadDiagram(SHOW_USER_APPMAP);
      const computedDiff = diff(baseDiagram, headDiagram, { verbose: VERBOSE });
      const diffDiagram = buildDiffDiagram(computedDiff);

      it('UML matches expectation', async () => {
        const { diagram } = format(FormatType.PlantUML, diffDiagram, 'computed diff');
        await checkPlantUMLEqual(
          diagram,
          join(FIXTURE_DIR, 'sequenceDiagrams/userFoundVsNotFound.sequence.uml')
        );
      });

      it('Text matches expectation', async () => {
        const { diagram } = format(FormatType.Text, diffDiagram, 'computed diff');
        await checkTextEqual(
          diagram,
          join(FIXTURE_DIR, 'sequenceDiagrams/userFoundVsNotFound.sequence.txt')
        );
      });
    });
    describe('list users vs list users with prefetch', () => {
      const baseDiagram = loadDiagram(LIST_USERS_APPMAP);
      const headDiagram = loadDiagram(LIST_USERS_PREFETCH_APPMAP);
      const computedDiff = diff(baseDiagram, headDiagram, { verbose: VERBOSE });
      const diffDiagram = buildDiffDiagram(computedDiff);

      it('UML matches expectation', async () => {
        const { diagram } = format(FormatType.PlantUML, diffDiagram, 'computed diff');
        await checkPlantUMLEqual(
          diagram,
          join(FIXTURE_DIR, 'sequenceDiagrams/listVsListWithPrefetch.sequence.uml')
        );
      });
      it('Text matches expectation', async () => {
        const { diagram } = format(FormatType.Text, diffDiagram, 'computed diff');
        await checkTextEqual(
          diagram,
          join(FIXTURE_DIR, 'sequenceDiagrams/listVsListWithPrefetch.sequence.txt')
        );
      });
    });
  });
});

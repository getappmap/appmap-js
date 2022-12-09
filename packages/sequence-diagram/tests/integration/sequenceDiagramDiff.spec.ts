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
} from '../util';
import { format } from '../../src/formatter/plantUML';
import { join } from 'path';

describe('Sequence diagram diff', () => {
  describe('PlantUML', () => {
    describe('user found vs not found', () => {
      it('matches expectation', async () => {
        const baseDiagram = loadDiagram(USER_NOT_FOUND_APPMAP);
        const headDiagram = loadDiagram(SHOW_USER_APPMAP);
        const computedDiff = diff(baseDiagram, headDiagram, { verbose: VERBOSE });
        const diffDiagram = buildDiffDiagram(computedDiff);
        const plantUML = format(diffDiagram, 'diff.sequence.json');
        await checkPlantUMLEqual(
          plantUML,
          join(FIXTURE_DIR, 'sequenceDiagrams/userFoundVsNotFound.sequence.uml')
        );
      });
    });
    describe('list users vs list users with prefetch', () => {
      it('matches expectation', async () => {
        const baseDiagram = loadDiagram(LIST_USERS_APPMAP);
        const headDiagram = loadDiagram(LIST_USERS_PREFETCH_APPMAP);
        const computedDiff = diff(baseDiagram, headDiagram, { verbose: VERBOSE });
        const diffDiagram = buildDiffDiagram(computedDiff);
        const plantUML = format(diffDiagram, 'diff.sequence.json');
        await checkPlantUMLEqual(
          plantUML,
          join(FIXTURE_DIR, 'sequenceDiagrams/listVsListWithPrefetch.sequence.uml')
        );
      });
    });
  });
});

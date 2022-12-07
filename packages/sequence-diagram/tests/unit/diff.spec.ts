import assert from 'assert';
import diff, { MoveType } from '../../src/diff';
import {
  LIST_USERS_APPMAP,
  LIST_USERS_PREFETCH_APPMAP,
  loadDiagram,
  SHOW_USER_APPMAP,
  USER_NOT_FOUND_APPMAP,
  VERBOSE,
} from '../util';

describe('Sequence diagram diff', () => {
  describe('user found vs not found', () => {
    it('matches expectation', async () => {
      const baseDiagram = loadDiagram(SHOW_USER_APPMAP);
      const headDiagram = loadDiagram(USER_NOT_FOUND_APPMAP);
      const computedDiff = diff(headDiagram, baseDiagram, { verbose: VERBOSE });
      assert.deepStrictEqual(
        computedDiff.moves.map((state) => state.moveType),
        [
          MoveType.AdvanceBoth,
          MoveType.Change,

          MoveType.InsertRight,
          MoveType.InsertRight,
          MoveType.InsertRight,
          MoveType.InsertRight,
          MoveType.AdvanceBoth,
          MoveType.InsertRight,
          MoveType.InsertRight,
        ]
      );
    });
  });
  describe('list users without and with prefetch', () => {
    it('matches expectation', async () => {
      const baseDiagram = loadDiagram(LIST_USERS_APPMAP);
      const headDiagram = loadDiagram(LIST_USERS_PREFETCH_APPMAP);
      const computedDiff = diff(headDiagram, baseDiagram, { verbose: VERBOSE });
      assert.deepStrictEqual(
        computedDiff.moves.map((state) => state.moveType),
        [
          MoveType.AdvanceBoth,
          MoveType.AdvanceBoth,
          MoveType.AdvanceBoth,

          MoveType.DeleteLeft,
          MoveType.DeleteLeft,

          MoveType.AdvanceBoth,
          MoveType.AdvanceBoth,
          MoveType.AdvanceBoth,

          MoveType.InsertRight,
          MoveType.InsertRight,

          MoveType.AdvanceBoth,
          MoveType.AdvanceBoth,
        ]
      );
    });
  });
});

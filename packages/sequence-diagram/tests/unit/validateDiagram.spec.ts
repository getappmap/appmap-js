import assert from 'assert';
import { validateDiagram, ValidationResult } from '@appland/sequence-diagram';
import {
  SHOW_USER_APPMAP_DATA,
  SHOW_USER_DIAGRAM_DATA,
  SEQUENCE_DIAGRAMS_DIR,
  LVL_PREFETCH_DIAGRAM_DATA,
  USER_FVNF_DIAGRAM_DATA,
} from '../util';

describe('validateDiagram', () => {
  it('returns Valid for a valid diagram', async () => {
    const result = await validateDiagram(SHOW_USER_DIAGRAM_DATA);
    assert.strictEqual(result, ValidationResult.Valid);
  });

  it('returns Invalid if missing actors', async () => {
    const NO_ACTORS_DIAGRAM_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete NO_ACTORS_DIAGRAM_DATA.actors;
    const result = await validateDiagram(NO_ACTORS_DIAGRAM_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns AppMap for an AppMap object', async () => {
    const result = await validateDiagram(SHOW_USER_APPMAP_DATA);
    assert.strictEqual(result, ValidationResult.AppMap);
  });

  it('returns Invalid if missing rootActions', async () => {
    const MISSING_ROOT_ACTIONS_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete MISSING_ROOT_ACTIONS_DATA.rootActions;
    const result = await validateDiagram(MISSING_ROOT_ACTIONS_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns Invalid if one of the actors is not valid', async () => {
    const INVALID_ACTOR_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete INVALID_ACTOR_DATA.actors[0].name;
    const result = await validateDiagram(INVALID_ACTOR_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns Invalid if one of the actions is missing nodeType', async () => {
    const INVALID_ACTION_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete INVALID_ACTION_DATA.rootActions[0].nodeType;
    const result = await validateDiagram(INVALID_ACTION_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns Invalid if one of the actions is missing eventIds', async () => {
    const INVALID_ACTION_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete INVALID_ACTION_DATA.rootActions[0].eventIds;
    const result = await validateDiagram(INVALID_ACTION_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns Invalid if one of the actions children is not valid', async () => {
    const INVALID_CHILD_ACTION_DATA = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete INVALID_CHILD_ACTION_DATA.rootActions[0].children[0].nodeType;
    const result = await validateDiagram(INVALID_CHILD_ACTION_DATA);
    assert.strictEqual(result, ValidationResult.Invalid);
  });

  it('returns Valid for fixtures/sequenceDiagrams/listVsListWithPrefetch.sequence.json', async () => {
    const result = await validateDiagram(LVL_PREFETCH_DIAGRAM_DATA);
    assert.strictEqual(result, ValidationResult.Valid);
  });

  it('returns Valid for fixtures/sequenceDiagrams/userFoundVsNotFound.sequence.json', async () => {
    const result = await validateDiagram(USER_FVNF_DIAGRAM_DATA);
    assert.strictEqual(result, ValidationResult.Valid);
  });
});

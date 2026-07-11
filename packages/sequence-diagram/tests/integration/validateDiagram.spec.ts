import assert from 'assert';

// Import from src (not the built package) so the validation call graph is
// instrumented and captured as a gold trace. The unit spec in tests/unit
// imports the public export (@appland/sequence-diagram -> dist), which the
// repo appmap.yml excludes and therefore records nothing.
import validateDiagram from '../../src/validateDiagram';
import { ValidationResult } from '../../src/types';

import { SHOW_USER_DIAGRAM_DATA, SHOW_USER_APPMAP_DATA } from '../util';

describe('Diagram validation', () => {
  // One deterministic trace exercising the whole validateDiagram gate: the
  // happy path (recursing validateAction over every action), the negative
  // branch (a structurally-invalid diagram), and AppMap detection.
  it('accepts a valid diagram and rejects an invalid one', async () => {
    const valid = await validateDiagram(SHOW_USER_DIAGRAM_DATA);
    assert.strictEqual(valid, ValidationResult.Valid);

    const INVALID = JSON.parse(JSON.stringify(SHOW_USER_DIAGRAM_DATA));
    delete INVALID.rootActions[0].children[0].nodeType;
    const invalid = await validateDiagram(INVALID);
    assert.strictEqual(invalid, ValidationResult.Invalid);

    const appmap = await validateDiagram(SHOW_USER_APPMAP_DATA);
    assert.strictEqual(appmap, ValidationResult.AppMap);
  });
});

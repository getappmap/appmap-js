import {
  APPMAP_COMPARISON_KIND,
  AppMapComparison,
  assertAppMapComparison,
} from '@appland/models';
import { Diagram, unparseDiagram } from '@appland/sequence-diagram';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import {
  buildComparisonBundle,
  handler as compareSequenceDiagrams,
  SequenceComparisonView,
} from '../../src/cmds/sequenceDiagramCompare';

const fixtureDir = path.join(
  '..',
  'sequence-diagram',
  'tests',
  'fixtures',
  'app',
  'tmp',
  'appmap'
);
const outputDir = path.join('tests', 'output', 'sequence-comparison');
const outputFile = path.join(outputDir, 'users.compare.diff.sequence.json');
const baseAppMap = path.join(fixtureDir, 'user_not_found.appmap.json');
const headAppMap = path.join(fixtureDir, 'show_user.appmap.json');
const changeIdPattern = /^chg_[0-9a-f]{20}(?:_[2-9][0-9]*|_[1-9][0-9]+)?$/;

type Bundle = AppMapComparison<{ sequence: SequenceComparisonView }>;

describe('sequence diagram compare command', () => {
  it('writes a view-neutral contract with a versioned sequence view', async () => {
    await compareSequenceDiagrams({
      baseAppmap: baseAppMap,
      headAppmap: headAppMap,
      outputFile,
      loops: true,
      scenario: 'show-user',
      baseRevision: 'base-sha',
      headRevision: 'head-sha',
    });

    expect(existsSync(outputFile)).toBe(true);
    const bundle = JSON.parse(await readFile(outputFile, 'utf8')) as Bundle;
    expect(() => assertAppMapComparison(bundle)).not.toThrow();

    expect(bundle.kind).toBe(APPMAP_COMPARISON_KIND);
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.scenario.id).toBe('show-user');
    expect(bundle.revisions).toEqual({ base: 'base-sha', head: 'head-sha' });
    expect(bundle.recordings).toEqual({
      base: 'user_not_found.appmap.json',
      head: 'show_user.appmap.json',
    });
    expect(bundle.capabilities.views).toEqual({ sequence: 1 });
    expect(bundle.changes.length).toBeGreaterThan(0);

    const sequence = bundle.views.sequence;
    const actorOrder = (diagram: Diagram) => diagram.actors.map((actor) => actor.id);
    const diffActors = actorOrder(sequence.diff);
    const baseActors = actorOrder(sequence.base);
    const headActors = actorOrder(sequence.head);
    expect(sequence.alignment.actorOrder).toEqual(diffActors);
    expect(baseActors).toEqual(diffActors.filter((actorId) => baseActors.includes(actorId)));
    expect(headActors).toEqual(diffActors.filter((actorId) => headActors.includes(actorId)));

    expect(() => unparseDiagram(sequence.base)).not.toThrow();
    expect(() => unparseDiagram(sequence.head)).not.toThrow();
    expect(() => unparseDiagram(sequence.diff)).not.toThrow();

    bundle.changes.forEach((change) => {
      expect(change.id).toMatch(changeIdPattern);
      expect(change.kind).toMatch(/-(added|removed|changed)$/);
      expect(change.views.sequence).toBeDefined();
    });
  });

  it('assigns deterministic ids which do not depend on positional numbering', async () => {
    const options = {
      scenario: 'show-user',
      baseRevision: 'base-sha',
      headRevision: 'head-sha',
    };
    const first = await buildComparisonBundle(baseAppMap, headAppMap, options);
    const second = await buildComparisonBundle(baseAppMap, headAppMap, options);

    expect(first.changes.map((change) => change.id)).toEqual(
      second.changes.map((change) => change.id)
    );
    expect(first.changes.every((change) => !change.id.startsWith('change-'))).toBe(true);
  });
});

beforeEach(() => mkdirSync(outputDir, { recursive: true }));

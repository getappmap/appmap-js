import { Diagram, DiffMode, unparseDiagram } from '@appland/sequence-diagram';
import { existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import path from 'path';

import {
  handler as compareSequenceDiagrams,
  SequenceComparisonBundle,
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

describe('sequence diagram compare command', () => {
  it('writes a self-contained before, after, and merged diff bundle', async () => {
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
    const bundle = JSON.parse(
      await readFile(outputFile, 'utf8')
    ) as SequenceComparisonBundle;

    expect(bundle.kind).toBe('appmap.sequence-comparison');
    expect(bundle.schemaVersion).toBe(1);
    expect(bundle.scenario).toBe('show-user');
    expect(bundle.baseRevision).toBe('base-sha');
    expect(bundle.headRevision).toBe('head-sha');
    expect(bundle.changes.length).toBeGreaterThan(0);

    const actorOrder = (diagram: Diagram) => diagram.actors.map((actor) => actor.id);
    const diffActors = actorOrder(bundle.diff);
    const baseActors = actorOrder(bundle.base);
    const headActors = actorOrder(bundle.head);
    expect(baseActors).toEqual(diffActors.filter((actorId) => baseActors.includes(actorId)));
    expect(headActors).toEqual(diffActors.filter((actorId) => headActors.includes(actorId)));

    expect(() => unparseDiagram(bundle.base)).not.toThrow();
    expect(() => unparseDiagram(bundle.head)).not.toThrow();
    expect(() => unparseDiagram(bundle.diff)).not.toThrow();

    const changed = bundle.changes.find((change) => change.diffMode === DiffMode.Change);
    const addedOrRemoved = bundle.changes.find(
      (change) => change.diffMode === DiffMode.Insert || change.diffMode === DiffMode.Delete
    );
    expect(changed || addedOrRemoved).toBeDefined();
    bundle.changes.forEach((change) => {
      expect(change.id).toMatch(/^change-\d{4}$/);
      expect(Array.isArray(change.baseEventIds)).toBe(true);
      expect(Array.isArray(change.headEventIds)).toBe(true);
      expect(Array.isArray(change.diffEventIds)).toBe(true);
    });
  });
});

beforeEach(() => mkdirSync(outputDir, { recursive: true }));

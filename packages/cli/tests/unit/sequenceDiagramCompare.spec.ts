import {
  APPMAP_COMPARISON_CHANGE_ID_PATTERN,
  APPMAP_COMPARISON_KIND,
  AppMapComparison,
  ComparisonSequenceDiagram,
  assertAppMapComparison,
} from '@appland/models';
import { Diagram, unparseDiagram } from '@appland/sequence-diagram';
import { existsSync } from 'fs';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import path from 'path';

import {
  buildComparisonBundle,
  handler as compareSequenceDiagrams,
  SequenceComparisonView,
} from '../../src/cmds/sequenceDiagramCompare';

const fixtureDir = path.join('..', 'sequence-diagram', 'tests', 'fixtures', 'app', 'tmp', 'appmap');
let outputDir: string;
let outputFile: string;
const baseAppMap = path.join(fixtureDir, 'user_not_found.appmap.json');
const headAppMap = path.join(fixtureDir, 'show_user.appmap.json');
const changeIdPattern = new RegExp(APPMAP_COMPARISON_CHANGE_ID_PATTERN);

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
    const actorOrder = (diagram: ComparisonSequenceDiagram) =>
      diagram.actors.map((actor) => actor.id);
    const diffActors = actorOrder(sequence.diff);
    const baseActors = actorOrder(sequence.base);
    const headActors = actorOrder(sequence.head);
    expect(sequence.alignment.actorOrder).toEqual(diffActors);
    expect(baseActors).toEqual(diffActors.filter((actorId) => baseActors.includes(actorId)));
    expect(headActors).toEqual(diffActors.filter((actorId) => headActors.includes(actorId)));

    expect(() =>
      unparseDiagram(JSON.parse(JSON.stringify(sequence.base)) as Diagram)
    ).not.toThrow();
    expect(() =>
      unparseDiagram(JSON.parse(JSON.stringify(sequence.head)) as Diagram)
    ).not.toThrow();
    expect(() =>
      unparseDiagram(JSON.parse(JSON.stringify(sequence.diff)) as Diagram)
    ).not.toThrow();

    bundle.changes.forEach((change) => {
      expect(change.id).toMatch(changeIdPattern);
      expect(change.kind).toMatch(/-(added|removed|changed|reordered)$/);
      expect(change.views.sequence).toBeDefined();
      Object.values(change.views.sequence || {})
        .filter(Boolean)
        .forEach((reference) => {
          expect(
            (reference?.eventIds?.length || 0) + (reference?.elementIds?.length || 0)
          ).toBeGreaterThan(0);
        });
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

beforeEach(async () => {
  outputDir = await mkdtemp(path.join(tmpdir(), 'ak7594-existing-'));
  outputFile = path.join(outputDir, 'users.compare.diff.sequence.json');
});
afterEach(async () => {
  await rm(outputDir, { recursive: true, force: true });
});

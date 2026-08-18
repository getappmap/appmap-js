import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';

import { AppMap, buildAppMap } from '@appland/models';
import {
  Action,
  Actor,
  buildDiagram,
  buildDiffDiagram,
  Diagram,
  diff,
  DiffMode,
  FormatType,
  format as formatDiagram,
  Move,
  MoveType,
  nodeName,
  nodeResult,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';

import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';

export const command = 'sequence-diagram-compare <base-appmap> <head-appmap>';
export const describe =
  'Create a self-contained, interactive before/after sequence comparison bundle';

export type SequenceComparisonChange = {
  id: string;
  kind: 'added' | 'removed' | 'changed';
  diffMode: DiffMode;
  baseEventIds: number[];
  headEventIds: number[];
  diffEventIds: number[];
  name: string;
  formerName?: string;
  result?: string;
  formerResult?: string;
  labels?: string[];
};

export type SequenceComparisonBundle = {
  kind: 'appmap.sequence-comparison';
  schemaVersion: 1;
  scenario?: string;
  baseRevision?: string;
  headRevision?: string;
  baseAppMap: string;
  headAppMap: string;
  base: Diagram;
  head: Diagram;
  diff: Diagram;
  changes: SequenceComparisonChange[];
};

export const builder = (args: yargs.Argv) => {
  args.positional('base-appmap', {
    describe: 'AppMap recorded before the change',
    type: 'string',
    demandOption: true,
  });
  args.positional('head-appmap', {
    describe: 'AppMap recorded after the change',
    type: 'string',
    demandOption: true,
  });
  args.option('directory', {
    describe: 'program working directory',
    type: 'string',
    alias: 'd',
  });
  args.option('output-file', {
    describe: 'comparison bundle file to write',
    type: 'string',
  });
  args.option('output-dir', {
    describe: 'directory in which to write the comparison bundle',
    type: 'string',
  });
  args.option('scenario', {
    describe: 'stable scenario name shown by comparison viewers',
    type: 'string',
  });
  args.option('base-revision', {
    describe: 'base Git revision recorded in the bundle',
    type: 'string',
  });
  args.option('head-revision', {
    describe: 'head Git revision recorded in the bundle',
    type: 'string',
  });
  args.option('loops', {
    describe: 'identify loops and collect them under Loop objects',
    type: 'boolean',
    default: true,
  });
  args.option('expand', {
    describe: 'code objects to expand in all three diagrams',
    type: 'string',
  });

  return args.strict();
};

function serializeDiagram(diagram: Diagram, description: string): Diagram {
  const formatted = formatDiagram(FormatType.JSON, diagram, description);
  return JSON.parse(formatted.diagram) as Diagram;
}

function alignActors(diagrams: Diagram[]): void {
  const actorIds: string[] = [];
  const seen = new Set<string>();

  // The merged diagram already contains the most useful union ordering. Add any
  // actor which is only present as otherwise-unused context afterwards.
  for (const diagram of [...diagrams].reverse()) {
    for (const actor of [...diagram.actors].sort((a, b) => a.order - b.order)) {
      if (seen.has(actor.id)) continue;
      seen.add(actor.id);
      actorIds.push(actor.id);
    }
  }

  const order = new Map(actorIds.map((id, index) => [id, index]));
  for (const diagram of diagrams) {
    diagram.actors.forEach((actor: Actor) => {
      actor.order = order.get(actor.id) ?? actor.order;
    });
    diagram.actors.sort((a, b) => a.order - b.order);
  }
}

function actionAt(actions: Action[], index: number): Action | undefined {
  if (index < 0 || index >= actions.length) return undefined;
  return actions[index];
}

function comparisonChange(
  move: Move,
  index: number,
  baseActions: Action[],
  headActions: Action[]
): SequenceComparisonChange | undefined {
  const baseAction = actionAt(baseActions, move.lNode);
  const headAction = actionAt(headActions, move.rNode);

  let kind: SequenceComparisonChange['kind'];
  let diffMode: DiffMode;
  switch (move.moveType) {
    case MoveType.InsertRight:
      kind = 'added';
      diffMode = DiffMode.Insert;
      break;
    case MoveType.DeleteLeft:
      kind = 'removed';
      diffMode = DiffMode.Delete;
      break;
    case MoveType.Change:
      kind = 'changed';
      diffMode = DiffMode.Change;
      break;
    case MoveType.AdvanceBoth:
      return undefined;
  }

  const primaryAction = headAction || baseAction;
  if (!primaryAction) return undefined;

  const baseEventIds = baseAction?.eventIds || [];
  const headEventIds = headAction?.eventIds || [];
  const diffEventIds = kind === 'removed' ? baseEventIds : headEventIds;

  return {
    id: `change-${String(index + 1).padStart(4, '0')}`,
    kind,
    diffMode,
    baseEventIds,
    headEventIds,
    diffEventIds,
    name: nodeName(primaryAction),
    formerName: baseAction ? nodeName(baseAction) : undefined,
    result: headAction ? nodeResult(headAction) : undefined,
    formerResult: baseAction ? nodeResult(baseAction) : undefined,
    labels: headAction?.labels || baseAction?.labels,
  };
}

function buildDiagramFor(appmapFile: string, appmap: AppMap, options: SequenceDiagramOptions) {
  const specification = Specification.build(appmap, options);
  return buildDiagram(appmapFile, appmap, specification);
}

export async function buildComparisonBundle(
  baseAppMapFile: string,
  headAppMapFile: string,
  options: {
    loops?: boolean;
    expand?: string | string[];
    scenario?: string;
    baseRevision?: string;
    headRevision?: string;
  } = {}
): Promise<SequenceComparisonBundle> {
  const baseData = JSON.parse(await readFile(baseAppMapFile, 'utf-8'));
  const headData = JSON.parse(await readFile(headAppMapFile, 'utf-8'));
  const baseAppMap = buildAppMap().source(baseData).build();
  const headAppMap = buildAppMap().source(headData).build();

  const diagramOptions: SequenceDiagramOptions = {
    loops: options.loops !== false,
  };
  if (options.expand)
    diagramOptions.expand = Array.isArray(options.expand) ? options.expand : [options.expand];

  const baseDiagram = buildDiagramFor(baseAppMapFile, baseAppMap, diagramOptions);
  const headDiagram = buildDiagramFor(headAppMapFile, headAppMap, diagramOptions);
  const computedDiff = diff(baseDiagram, headDiagram);
  const mergedDiagram = buildDiffDiagram(computedDiff);

  alignActors([baseDiagram, headDiagram, mergedDiagram]);

  const changes = computedDiff.moves
    .map((move, index) =>
      comparisonChange(move, index, computedDiff.baseActions, computedDiff.headActions)
    )
    .filter(Boolean) as SequenceComparisonChange[];

  return {
    kind: 'appmap.sequence-comparison',
    schemaVersion: 1,
    scenario: options.scenario,
    baseRevision: options.baseRevision,
    headRevision: options.headRevision,
    baseAppMap: basename(baseAppMapFile),
    headAppMap: basename(headAppMapFile),
    base: serializeDiagram(baseDiagram, 'base'),
    head: serializeDiagram(headDiagram, 'head'),
    diff: serializeDiagram(mergedDiagram, 'diff'),
    changes,
  };
}

export const handler = async (argv: any) => {
  verbose(argv.verbose);
  handleWorkingDirectory(argv.directory);

  const baseAppMapFile = argv.baseAppmap as string;
  const headAppMapFile = argv.headAppmap as string;
  const bundle = await buildComparisonBundle(baseAppMapFile, headAppMapFile, {
    loops: argv.loops,
    expand: argv.expand,
    scenario: argv.scenario,
    baseRevision: argv.baseRevision,
    headRevision: argv.headRevision,
  });

  const defaultFileName = `${basename(
    headAppMapFile,
    '.appmap.json'
  )}.compare.diff.sequence.json`;
  const outputFile = argv.outputFile
    ? (argv.outputFile as string)
    : join((argv.outputDir as string) || dirname(headAppMapFile), defaultFileName);

  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, JSON.stringify(bundle, null, 2));
  console.log(`Printed comparison bundle ${outputFile}`);
};

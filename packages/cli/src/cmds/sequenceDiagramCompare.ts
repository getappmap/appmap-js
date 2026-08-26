import { mkdir, readFile, writeFile } from 'fs/promises';
import { basename, dirname, join } from 'path';
import yargs from 'yargs';

import {
  AppMap,
  AppMapComparison,
  BehavioralChange,
  BehavioralChangeKind,
  ComparisonReference,
  ComparisonValueChange,
  ComparisonView,
  APPMAP_COMPARISON_KIND,
  APPMAP_COMPARISON_SCHEMA_VERSION,
  assertAppMapComparison,
  buildAppMap,
  makeComparisonChangeId,
} from '@appland/models';
import {
  Action,
  Actor,
  actionActors,
  buildDiagram,
  buildDiffDiagram,
  Diagram,
  diff,
  FormatType,
  format as formatDiagram,
  Move,
  MoveType,
  NodeType,
  nodeName,
  nodeResult,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';

import { handleWorkingDirectory } from '../lib/handleWorkingDirectory';
import { verbose } from '../utils';

const packageVersion = require('../../package.json').version as string;

export const command = 'sequence-diagram-compare <base-appmap> <head-appmap>';
export const describe =
  'Create a self-contained, interactive before/after AppMap comparison bundle';

type SequenceAlignment = {
  actorOrder: string[];
};

export type SequenceComparisonView = ComparisonView<Diagram, SequenceAlignment>;
export type SequenceComparisonBundle = AppMapComparison<{
  sequence: SequenceComparisonView;
}>;

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
    describe: 'stable scenario id shown by comparison viewers',
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

function alignActors(diagrams: Diagram[]): string[] {
  const actorIds: string[] = [];
  const seen = new Set<string>();

  // The merged diagram provides the useful union ordering. Add otherwise-unused
  // actors from the individual diagrams afterwards.
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

  return actorIds;
}

function actionAt(actions: Action[], index: number): Action | undefined {
  if (index < 0 || index >= actions.length) return undefined;
  return actions[index];
}

function actionFamily(action: Action): 'call' | 'query' | 'rpc' | 'control-flow' {
  switch (action.nodeType) {
    case NodeType.Function:
      return 'call';
    case NodeType.Query:
      return 'query';
    case NodeType.ServerRPC:
    case NodeType.ClientRPC:
      return 'rpc';
    case NodeType.Loop:
      return 'control-flow';
  }
}

function actionIdentity(action: Action | undefined): unknown {
  if (!action) return null;

  const ancestors: unknown[] = [];
  let parent = action.parent;
  while (parent) {
    ancestors.unshift({
      nodeType: parent.nodeType,
      digest: parent.digest,
      actors: actionActors(parent).map((actor) => actor?.id || null),
      name: nodeName(parent),
    });
    parent = parent.parent;
  }

  return {
    nodeType: action.nodeType,
    digest: action.digest,
    actors: actionActors(action).map((actor) => actor?.id || null),
    name: nodeName(action),
    ancestors,
  };
}

function referenceFor(
  action: Action | undefined,
  elementId: string
): ComparisonReference | undefined {
  if (!action) return undefined;

  // Loops and other structural actions may not own an AppMap event. Preserve
  // them with a comparison-local element id so every semantic change remains
  // navigable even when event-based highlighting is unavailable.
  const reference: ComparisonReference = {
    elementIds: [elementId],
  };
  if (action.eventIds.length > 0) reference.eventIds = [...action.eventIds];
  return reference;
}

function valueChange(
  before: string | number | undefined,
  after: string | number | undefined
): ComparisonValueChange | undefined {
  if (before === undefined && after === undefined) return undefined;

  const change: ComparisonValueChange = {};
  if (before !== undefined) change.before = before;
  if (after !== undefined) change.after = after;
  return change;
}

function comparisonChange(
  move: Move,
  baseActions: Action[],
  headActions: Action[],
  occurrences: Map<string, number>
): BehavioralChange | undefined {
  // Insert and delete moves retain the other cursor's previous position. It is
  // context, not the corresponding action, so never expose it as an alignment.
  const baseAction =
    move.moveType === MoveType.InsertRight ? undefined : actionAt(baseActions, move.lNode);
  const headAction =
    move.moveType === MoveType.DeleteLeft ? undefined : actionAt(headActions, move.rNode);

  let status: 'added' | 'removed' | 'changed';
  switch (move.moveType) {
    case MoveType.InsertRight:
      status = 'added';
      break;
    case MoveType.DeleteLeft:
      status = 'removed';
      break;
    case MoveType.Change:
      status = 'changed';
      break;
    case MoveType.AdvanceBoth:
      return undefined;
  }

  const primaryAction = headAction || baseAction;
  if (!primaryAction) return undefined;

  const kind = `${actionFamily(primaryAction)}-${status}` as BehavioralChangeKind;
  const identity = {
    version: 1,
    kind,
    base: actionIdentity(baseAction),
    head: actionIdentity(headAction),
  };
  const baseId = makeComparisonChangeId(identity);
  const occurrence = occurrences.get(baseId) || 0;
  occurrences.set(baseId, occurrence + 1);
  const changeId = makeComparisonChangeId(identity, occurrence);

  const base = referenceFor(baseAction, `${changeId}:sequence:base`);
  const head = referenceFor(headAction, `${changeId}:sequence:head`);
  const diffAction = status === 'removed' ? baseAction : headAction;
  const diff = referenceFor(diffAction, `${changeId}:sequence:diff`);
  const details = {
    name: valueChange(
      baseAction ? nodeName(baseAction) : undefined,
      headAction ? nodeName(headAction) : undefined
    ),
    result: valueChange(nodeResult(baseAction), nodeResult(headAction)),
  };
  const filteredDetails = Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined)
  ) as Record<string, ComparisonValueChange>;
  const labels = Array.from(new Set(headAction?.labels || baseAction?.labels || [])).sort();

  return {
    id: changeId,
    kind,
    summary: `${status[0].toUpperCase()}${status.slice(1)} ${nodeName(primaryAction)}`,
    base,
    head,
    views: {
      sequence: {
        base,
        head,
        diff,
      },
    },
    details: Object.keys(filteredDetails).length > 0 ? filteredDetails : undefined,
    labels: labels.length > 0 ? labels : undefined,
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
  const actorOrder = alignActors([baseDiagram, headDiagram, mergedDiagram]);

  const occurrences = new Map<string, number>();
  const changes = computedDiff.moves
    .map((move) =>
      comparisonChange(move, computedDiff.baseActions, computedDiff.headActions, occurrences)
    )
    .filter(Boolean) as BehavioralChange[];

  const revisions: SequenceComparisonBundle['revisions'] = {};
  if (options.baseRevision) revisions.base = options.baseRevision;
  if (options.headRevision) revisions.head = options.headRevision;

  const scenarioId = options.scenario || basename(headAppMapFile, '.appmap.json');
  const bundle: SequenceComparisonBundle = {
    kind: APPMAP_COMPARISON_KIND,
    schemaVersion: APPMAP_COMPARISON_SCHEMA_VERSION,
    producer: {
      name: '@appland/appmap',
      version: packageVersion,
    },
    scenario: {
      id: scenarioId,
    },
    revisions: Object.keys(revisions).length > 0 ? revisions : undefined,
    recordings: {
      base: basename(baseAppMapFile),
      head: basename(headAppMapFile),
    },
    capabilities: {
      views: {
        sequence: 1,
      },
      navigation: {
        changes: 1,
        eventAlignment: 1,
      },
    },
    changes,
    views: {
      sequence: {
        schemaVersion: 1,
        base: serializeDiagram(baseDiagram, 'base'),
        head: serializeDiagram(headDiagram, 'head'),
        diff: serializeDiagram(mergedDiagram, 'diff'),
        alignment: {
          actorOrder,
        },
      },
    },
  };

  assertAppMapComparison(bundle);
  return bundle;
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

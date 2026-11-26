import { basename } from 'path';
import Ajv2020 from 'ajv/dist/2020';
import {
  AppMap,
  AppMapComparison,
  ComparisonSequenceDiagram,
  ComparisonSequenceView,
  APPMAP_COMPARISON_KIND,
  APPMAP_COMPARISON_SCHEMA_VERSION,
  assertAppMapComparison,
  appMapComparisonSchema,
} from '@appland/models';
import {
  buildDiagram,
  buildDiffDiagram,
  Diagram,
  diff,
  FormatType,
  format,
  SequenceDiagramOptions,
  Specification,
} from '@appland/sequence-diagram';
import { assignTargets, flatten } from './actions';
import { assignSemanticDigests } from './semantics';
import { DisplayProjection } from './projection';
import { adaptDiff, buildChanges, pairs } from './changes';
import { loadRecording } from './input';

export type SequenceComparisonBundle = AppMapComparison<{ sequence: ComparisonSequenceView }>;
export type ComparisonOptions = {
  loops?: boolean;
  expand?: string | string[];
  scenario?: string;
  baseRevision?: string;
  headRevision?: string;
};
const version = (require('../../../package.json') as { version: string }).version;
const checkSchema = new Ajv2020({ strict: false, allErrors: true }).compile(appMapComparisonSchema);
function serialize(diagram: Diagram): ComparisonSequenceDiagram {
  return JSON.parse(
    format(FormatType.JSON, diagram, 'comparison').diagram
  ) as ComparisonSequenceDiagram;
}
function alignActors(diagrams: Diagram[]): string[] {
  const ids = [
    ...new Set(
      [...diagrams]
        .reverse()
        .flatMap((diagram) =>
          [...diagram.actors].sort((a, b) => a.order - b.order).map((actor) => actor.id)
        )
    ),
  ];
  const order = new Map(ids.map((id, i) => [id, i]));
  for (const diagram of diagrams) {
    diagram.actors.forEach((actor) => {
      actor.order = order.get(actor.id) ?? actor.order;
    });
    diagram.actors.sort((a, b) => a.order - b.order);
  }
  return ids;
}
function diagramFor(file: string, appmap: AppMap, options: SequenceDiagramOptions): Diagram {
  const diagram = buildDiagram(file, appmap, Specification.build(appmap, options));
  if (appmap.events.some((event) => event.isCall()) && !diagram.rootActions.length)
    throw new TypeError(`Invalid AppMap ${file}: no supported sequence actions`);
  return diagram;
}
export async function buildComparisonBundle(
  baseFile: string,
  headFile: string,
  options: ComparisonOptions = {}
): Promise<SequenceComparisonBundle> {
  const baseAppMap = await loadRecording(baseFile);
  const headAppMap = await loadRecording(headFile);
  const diagramOptions: SequenceDiagramOptions = {
    loops: options.loops !== false,
    ...(options.expand
      ? { expand: Array.isArray(options.expand) ? options.expand : [options.expand] }
      : {}),
  };
  // Behavior is aligned before presentation grouping. Build the requested
  // display independently so its ordinary render digests remain untouched.
  const semanticBase = diagramFor(baseFile, baseAppMap, { ...diagramOptions, loops: false });
  const semanticHead = diagramFor(headFile, headAppMap, { ...diagramOptions, loops: false });
  assignSemanticDigests(semanticBase);
  assignSemanticDigests(semanticHead);
  assignTargets(semanticBase, 'semantic-base');
  assignTargets(semanticHead, 'semantic-head');
  const base = diagramFor(baseFile, baseAppMap, diagramOptions);
  const head = diagramFor(headFile, headAppMap, diagramOptions);
  assignTargets(base, 'base');
  assignTargets(head, 'head');
  const projection = { base: new DisplayProjection(base), head: new DisplayProjection(head) };
  // Check even unchanged actions: never silently publish partial navigation.
  flatten(semanticBase).forEach((action) => projection.base.project(action));
  flatten(semanticHead).forEach((action) => projection.head.project(action));
  const computed = adaptDiff(diff(semanticBase, semanticHead));
  const alignment = pairs(computed); // Fail closed before passing unknown operations to the renderer.
  const overlay = buildDiffDiagram(computed);
  const origins = assignTargets(overlay, 'diff');
  const actorOrder = alignActors([base, head, overlay]);
  const revisions = {
    ...(options.baseRevision ? { base: options.baseRevision } : {}),
    ...(options.headRevision ? { head: options.headRevision } : {}),
  };
  const bundle: SequenceComparisonBundle = {
    kind: APPMAP_COMPARISON_KIND,
    schemaVersion: APPMAP_COMPARISON_SCHEMA_VERSION,
    producer: { name: '@appland/appmap', version },
    scenario: { id: options.scenario || basename(headFile, '.appmap.json') },
    ...(Object.keys(revisions).length ? { revisions } : {}),
    recordings: { base: basename(baseFile), head: basename(headFile) },
    capabilities: { views: { sequence: 1 }, navigation: { changes: 1, eventAlignment: 1 } },
    changes: buildChanges(alignment, semanticBase, semanticHead, origins, projection),
    views: {
      sequence: {
        schemaVersion: 1,
        base: serialize(base),
        head: serialize(head),
        diff: serialize(overlay),
        alignment: { actorOrder },
      },
    },
  };
  if (!checkSchema(bundle))
    throw new TypeError(`Invalid comparison structure: ${JSON.stringify(checkSchema.errors)}`);
  assertAppMapComparison(bundle);
  return bundle;
}

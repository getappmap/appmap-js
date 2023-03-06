import { AppMapReference } from './AppMapReference';
import { OpenAPIV3 } from 'openapi-types';
import { Changes, Operation, OperationChange, RouteChanges } from './types';
import assert from 'assert';
import { executeCommand } from './executeCommand';
import { exists, shuffleArray } from '../utils';
import { OperationReference } from './OperationReference';
import { RevisionName } from './RevisionName';
import { Action, Diagram as SequenceDiagram } from '@appland/sequence-diagram';
import { DiffDiagrams } from '../sequenceDiagramDiff/DiffDiagrams';

export default async function buildChangeReport(
  baseRevision: string,
  basePaths: OpenAPIV3.PathsObject,
  headPaths: OpenAPIV3.PathsObject,
  baseAppMapFileNames: Set<string>,
  headAppMapFileNames: Set<string>,
  operationReference: OperationReference,
  appmapReferences: Map<string, AppMapReference>
): Promise<Changes> {
  const buildOperationAdded = async (operation: Operation): Promise<OperationChange> => {
    return { operation /* sourceDiff, sequenceDiagrams */ };
  };
  const buildOperationChanged = async (
    operation: Operation
  ): Promise<OperationChange | undefined> => {
    console.log(
      OperationReference.operationKey(operation.method, operation.path, operation.status)
    );

    const baseDiagrams = new Set(
      await operationReference.listSequenceDiagrams(RevisionName.Base, {
        method: operation.method,
        path: operation.path,
        status: operation.status,
      })
    );
    const headDiagrams = new Set(
      await operationReference.listSequenceDiagrams(RevisionName.Head, {
        method: operation.method,
        path: operation.path,
        status: operation.status,
      })
    );
    const baseOnlyDiagrams = new Array<string>();
    const headOnlyDiagrams = new Array<string>();
    baseDiagrams.forEach((diagram) =>
      headDiagrams.has(diagram) ? undefined : baseOnlyDiagrams.push(diagram)
    );
    headDiagrams.forEach((diagram) =>
      baseDiagrams.has(diagram) ? undefined : headOnlyDiagrams.push(diagram)
    );

    if (baseOnlyDiagrams.length === 0 && headOnlyDiagrams.length === 0) return;

    const diffAlgorithm = new DiffDiagrams();
    // TODO: Apply includes and excludes to reduce noise and false positives.

    function countDiffActions(diagram: SequenceDiagram | undefined): number {
      if (!diagram) return 0;

      let count = 0;
      const countAction = (action: Action) => {
        if (action.diffMode) count += 1;
        action.children.forEach(countAction);
      };
      diagram.rootActions.forEach(countAction);
      return count;
    }

    const minimalDiff = async (
      headDiagram: SequenceDiagram,
      baseDiagrams: string[]
    ): Promise<SequenceDiagram | undefined> => {
      return (
        await Promise.all<SequenceDiagram | undefined>(
          baseDiagrams.map(async (baseDiagramId) => {
            const baseDiagram = await operationReference.loadSequenceDiagram(
              RevisionName.Base,
              baseDiagramId
            );
            return diffAlgorithm.diff(baseDiagram, headDiagram);
          })
        )
      )
        .filter(Boolean)
        .sort((a, b) => countDiffActions(a) - countDiffActions(b))[0];
    };

    const sequenceDiagrams = (
      await Promise.all<SequenceDiagram | undefined>(
        headOnlyDiagrams.map(async (headDiagramId) => {
          const headDiagram = await operationReference.loadSequenceDiagram(
            RevisionName.Head,
            headDiagramId
          );
          // Choose three random base diagrams. Compute the diff between the head diagram and each of
          // the randomly selected base diagrams. Report the diff with the smallest number of changes.
          const baseDiagramIds = shuffleArray([...baseOnlyDiagrams]).slice(0, 3);
          return await minimalDiff(headDiagram, baseDiagramIds);
        })
      )
    ).filter(Boolean) as SequenceDiagram[];

    let sourcePaths: string[] | undefined;
    let sourceDiff: string | undefined;

    const candidateSourcePaths = operationReference.sourcePathsByOperation.get(
      OperationReference.operationKey(operation.method, operation.path, operation.status)
    );
    if (candidateSourcePaths) {
      const existingSourcePaths = new Set<string>();
      await Promise.all(
        [...candidateSourcePaths].map(
          async (path) => (await exists(path)) && existingSourcePaths.add(path)
        )
      );
      sourcePaths = [...candidateSourcePaths].filter((path) => existingSourcePaths.has(path));
    }

    if (sourcePaths && sourcePaths.length > 0) {
      sourceDiff = await executeCommand(
        `git diff ${baseRevision} -- ${[...sourcePaths].sort().join(' ')}`,
        true,
        true,
        true
      );
    }

    return { operation, sourceDiff, sequenceDiagrams };
  };
  const buildOperationRemoved = (operation: Operation): OperationChange => {
    return { operation };
  };

  const routeChanges = {
    added: [],
    removed: [],
    changed: [],
  } as RouteChanges;

  for (const pattern of Object.keys(basePaths)) {
    const pathInfo = basePaths[pattern];
    assert(pathInfo);

    for (const method of Object.keys(pathInfo)) {
      const operation = pathInfo[method];
      assert(operation);

      for (const status of Object.keys(operation.responses)) {
        const operation: Operation = { method, path: pattern, status: parseInt(status, 10) };

        const headResponse = headPaths[pattern]?.[method]?.responses[status];
        if (!headResponse) {
          routeChanges.removed.push(buildOperationRemoved(operation));
          break;
        }

        const changed = await buildOperationChanged(operation);
        if (changed) routeChanges.changed.push(changed);
      }
    }
  }

  for (const pattern of Object.keys(headPaths)) {
    const pathInfo = headPaths[pattern];
    assert(pathInfo);

    for (const method of Object.keys(pathInfo)) {
      const operation = pathInfo[method];
      assert(operation);

      for (const status of Object.keys(operation.responses)) {
        const operation: Operation = { method, path: pattern, status: parseInt(status, 10) };

        const baseResponse = basePaths[pattern]?.[method]?.responses[status];
        if (!baseResponse) {
          routeChanges.added.push(await buildOperationAdded(operation));
        }
      }
    }
  }

  return {
    routeChanges,
  };
}

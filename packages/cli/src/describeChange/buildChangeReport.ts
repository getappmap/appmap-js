import { AppMapReference } from './AppMapReference';
import { OpenAPIV3 } from 'openapi-types';
import { Changes, Operation, OperationChange, RouteChanges } from './types';
import assert from 'assert';
import { executeCommand } from './executeCommand';
import { exists } from '../utils';
import { OperationReference } from './OperationReference';

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

    const candidateSourcePaths = operationReference.sourcePathsByOperation.get(
      OperationReference.operationKey(operation.method, operation.path, operation.status)
    );
    if (!candidateSourcePaths) return;

    const existingSourcePaths = new Set<string>();
    await Promise.all(
      [...candidateSourcePaths].map(
        async (path) => (await exists(path)) && existingSourcePaths.add(path)
      )
    );
    const sourcePaths = [...candidateSourcePaths].filter((path) => existingSourcePaths.has(path));

    let sourceDiff: string | undefined;
    if (sourcePaths && sourcePaths.length > 0) {
      sourceDiff = await executeCommand(
        `git diff ${baseRevision} -- ${[...sourcePaths].sort().join(' ')}`,
        true,
        true,
        true
      );
    }

    if (!sourceDiff) return;

    return { operation, sourceDiff /* sequenceDiagrams */ };
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

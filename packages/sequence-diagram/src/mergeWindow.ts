import sha256 from 'crypto-js/sha256.js';
import { LRUCache } from 'lru-cache';
import type { Action, Loop } from './types';
import {
  actionActors,
  isClientRPC,
  isFunction,
  isLoop,
  isQuery,
  isServerRPC,
  NodeType,
} from './types';

const sha256Cache = new LRUCache<string, string>({ max: 3000 });

function digest(sha256Input: string): string {
  let result = sha256Cache.get(sha256Input);
  if (!result) {
    result = sha256(sha256Input).toString();
    sha256Cache.set(sha256Input, result);
  }
  return result;
}

// Keep the loop-discovery digest independent of compression eligibility. Compression eligibility is stricter than
// the legacy subtree digest, which omits return metadata and nested loop counts.
function buildDigest(actions: Action[]): string {
  return digest(actions.map((action) => action.subtreeDigest).join('\n'));
}

function compressionProperties(action: Action): unknown[] {
  const functionProperties = isFunction(action)
    ? [
        action.name,
        action.static,
        Object.keys(action.stableProperties)
          .sort()
          .map((key) => [key, action.stableProperties[key]]),
        action.returnValue && [
          action.returnValue.raisesException,
          action.returnValue.returnValueType && [
            action.returnValue.returnValueType.name,
            action.returnValue.returnValueType.properties,
          ],
        ],
      ]
    : undefined;
  return [
    action.nodeType,
    action.digest,
    action.subtreeDigest,
    actionActors(action).map((actor) => actor?.id),
    isLoop(action) ? action.count : undefined,
    functionProperties,
    // A complete statement's digest is normalized on purpose, so iterations that differ
    // only in literal values still form a loop. Every truncated statement shares the
    // constant "truncatedQuery" digest, so compare its text instead.
    isQuery(action) && action.digest === 'truncatedQuery' ? action.query : undefined,
    action.labels,
    isServerRPC(action) || isClientRPC(action) ? [action.route, action.status] : undefined,
    // Inspect current children, not just a digest built before inner compression.
    action.children.map(compressionProperties),
  ];
}

function buildWindowDigest(actions: Action[]): string {
  return digest(JSON.stringify(actions.map(compressionProperties)));
}

function countDigests(actions: Action[], windowSize: number): Map<string, number> {
  const digestCount = new Map<string, number>();
  for (let index = 0; index + windowSize <= actions.length; index++) {
    const range = actions.slice(index, index + windowSize);
    const digest = buildWindowDigest(range);
    const count = digestCount.get(digest);
    if (count !== undefined) digestCount.set(digest, count + 1);
    else digestCount.set(digest, 1);
  }
  return digestCount;
}

type Merge = Action[][];

const isMerge = (item: Merge | Action): item is Merge => item.constructor === Array;

const buildLoop = (merge: Merge): Loop => {
  const digest = buildDigest(merge[0]);

  // Since we are going to use merge[0] as the children of the loop, the event ids and elapsed time from the
  // loop actions that will be discarded need to be merged into merge[0]. This needs to happen
  // recursively in order to avoid losing event ids and elapsed time data from nested loops.
  const aggregateLoopMemberData = (action: Action, duplicates: Action[]): void => {
    action.eventIds = [...action.eventIds, ...duplicates.map((d) => d.eventIds).flat()].sort(
      (a, b) => a - b
    );
    action.elapsed =
      (action.elapsed || 0) + duplicates.reduce((sum, d) => sum + (d.elapsed || 0), 0);
    action.children.forEach((child, index) => {
      aggregateLoopMemberData(
        child,
        duplicates.map((d) => d.children[index])
      );
    });
  };
  merge[0].forEach((member, index) => {
    aggregateLoopMemberData(
      member,
      merge.slice(1).map((m) => m[index])
    );
  });

  return {
    nodeType: NodeType.Loop,
    count: merge.length,
    digest: 'loop',
    subtreeDigest: ['loop', digest].join(':'),
    children: merge[0],
    elapsed: merge[0].reduce((sum, action) => sum + (action.elapsed || 0), 0),
    eventIds: [],
  } as Loop;
};

const unroll = (items: (Merge | Action)[]): Action[] => {
  const result: Action[] = [];
  items.forEach((item) => {
    if (isMerge(item)) {
      if (item.length > 1) result.push(buildLoop(item));
      else result.push(...item[0]);
    } else result.push(item);
  });
  return result;
};

export function merge(actions: Action[], windowSize: number): Action[] | undefined {
  const digestCount = countDigests(actions, windowSize);
  const digestsSorted = [...digestCount.keys()]
    .filter((key) => digestCount.get(key)! > 1)
    .sort((a, b) => digestCount.get(b)! - digestCount.get(a)!);

  if (digestsSorted.length === 0) return;

  for (let digestIndex = 0; digestIndex < digestsSorted.length; digestIndex++) {
    const referenceDigest = digestsSorted[digestIndex];
    const result: (Merge | Action)[] = [];
    let merge: Merge | undefined = undefined;
    for (let actionIndex = 0; actionIndex < actions.length; ) {
      const window = actions.slice(actionIndex, actionIndex + windowSize);
      const windowDigest = window.length === windowSize ? buildWindowDigest(window) : undefined;
      if (windowDigest === referenceDigest) {
        if (merge) {
          merge.push(window);
        } else {
          merge = [window];
          result.push(merge);
        }
        actionIndex += windowSize;
      } else {
        merge = undefined;
        result.push(window[0]);
        actionIndex += 1;
      }
    }
    const hasLoop = result.filter((item) => isMerge(item) && item.length > 1).length > 0;
    if (hasLoop) return unroll(result);
  }
}

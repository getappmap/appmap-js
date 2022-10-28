import { createHash } from 'crypto';
import { Action, Loop, NodeType } from './types';

function buildDigest(actions: Action[]): string {
  const hash = createHash('sha256');
  actions.forEach((action) => hash.update(action.subtreeDigest));
  return hash.digest('hex');
}

function countDigests(actions: Action[], windowSize: number): Map<string, number> {
  const digestCount = new Map<string, number>();
  for (let index = 0; index + windowSize <= actions.length; index++) {
    const range = actions.slice(index, index + windowSize);
    const digest = buildDigest(range);
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
  return {
    nodeType: NodeType.Loop,
    count: merge.length,
    digest: 'loop',
    subtreeDigest: ['loop', digest].join(':'),
    children: merge[0],
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
    for (let actionIndex = 0; actionIndex + windowSize <= actions.length; ) {
      const window = actions.slice(actionIndex, actionIndex + windowSize);
      const windowDigest = buildDigest(window);
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

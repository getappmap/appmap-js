import { Finding } from '../index';

export type FindingsDiff = {
  newFindings: Finding[];
  resolvedFindings: Finding[];
};

/**
 * Compare a prior set of findings to the current set, identifying findings by their
 * stable `hash_v2`. Both sides are deduped by hash so repeated findings don't skew the
 * result. With no prior findings, everything is new.
 */
export function diffFindings(prior: Finding[], current: Finding[]): FindingsDiff {
  const priorByHash = new Map(prior.map((f) => [f.hash_v2, f]));
  const currentByHash = new Map(current.map((f) => [f.hash_v2, f]));

  const newFindings = [...currentByHash.values()].filter((f) => !priorByHash.has(f.hash_v2));
  const resolvedFindings = [...priorByHash.values()].filter((f) => !currentByHash.has(f.hash_v2));

  return { newFindings, resolvedFindings };
}

import type { Finding } from '../index';

export type FindingsDiff = {
  newFindings: Finding[];
  resolvedFindings: Finding[];
};

/** Index findings by their stable `hash_v2`, keeping the first occurrence of each. */
function byHashV2(findings: Finding[]): Map<string, Finding> {
  const byHash = new Map<string, Finding>();
  for (const finding of findings) {
    if (!byHash.has(finding.hash_v2)) byHash.set(finding.hash_v2, finding);
  }
  return byHash;
}

/**
 * Compare a prior set of findings to the current set, identifying findings by their
 * stable `hash_v2`. Both sides are deduped by hash (first occurrence wins) so repeated
 * findings don't skew the result. With no prior findings, everything is new.
 */
export function diffFindings(prior: Finding[], current: Finding[]): FindingsDiff {
  const priorByHash = byHashV2(prior);
  const currentByHash = byHashV2(current);

  const newFindings = [...currentByHash.values()].filter((f) => !priorByHash.has(f.hash_v2));
  const resolvedFindings = [...priorByHash.values()].filter((f) => !currentByHash.has(f.hash_v2));

  return { newFindings, resolvedFindings };
}

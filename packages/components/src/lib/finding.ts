export type FindingListItem = {
  type: 'analysis-finding';
  id: string;
  resolvedFinding: any;
  name: string;
  shortName: string;
};

export type ResolvedFinding = {
  finding: {
    hash: string;
    hash_v2?: string;
    message: string;
  };
  rule: {
    title: string;
  };
};

export default function toListItem(resolvedFinding: ResolvedFinding) {
  return {
    type: 'analysis-finding',
    id: resolvedFinding.finding.hash_v2 || resolvedFinding.finding.hash,
    resolvedFinding,
    name: `${resolvedFinding.rule.title}: ${resolvedFinding.finding.message}`,
    shortName: resolvedFinding.rule.title,
  };
}

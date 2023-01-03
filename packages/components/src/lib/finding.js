import { CodeObjectType } from '@appland/models';

export default function toListItem(resolvedFinding) {
  return {
    type: CodeObjectType.ANALYSIS_FINDING,
    id: resolvedFinding.finding.hash_v2 || resolvedFinding.finding.hash,
    resolvedFinding,
    name: `${resolvedFinding.rule.title}: ${resolvedFinding.finding.message}`,
    shortName: resolvedFinding.rule.title,
  };
}

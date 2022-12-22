import { CodeObjectType } from '@appland/models';

export function toListItem(resolvedFinding) {
  return {
    type: CodeObjectType.ANALYSIS_FINDING,
    resolvedFinding,
    name: `${resolvedFinding.rule.title}: ${resolvedFinding.finding.message}`,
    shortName: resolvedFinding.rule.title,
  };
}

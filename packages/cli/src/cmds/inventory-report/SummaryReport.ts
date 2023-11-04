import { FindingChange } from '../compare-report/ChangeReport';

export type Rule = {
  ruleId: string;
  impactDomain: string;
};

export type SummaryReport = {
  findingRules: Rule[];
  findingRuleCountByImpactDomain: Record<string, number>;
  findings: FindingChange[];
  findingCount: number;
};

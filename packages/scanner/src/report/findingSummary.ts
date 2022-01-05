/**
 * FindingSummary summarizes the results from a single scanner across the entire scan.
 * It's used for printing a user-friendly summary report, it's not used for machine-readable program output.
 */
export interface FindingSummary {
  ruleId: string;
  ruleTitle: string;
  findingTotal: number;
  messages: Set<string>;
}

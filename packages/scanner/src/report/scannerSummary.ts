import { FindingSummary } from './findingSummary';

/**
 * ScannerSummary summarizes the results of the entire scan.
 * It's used for printing a user-friendly summary report, it's not used for machine-readable program output.
 */
export interface ScannerSummary {
  checkTotal: number;
  findingTotal: number;
  // key: the finding id.
  findingSummary: Record<string, FindingSummary>;
}

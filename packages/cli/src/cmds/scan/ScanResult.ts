import { ScanResults } from '@appland/scanner';

export type ScanResult = {
  oversized?: boolean;
  error?: Error;
  scanResults: ScanResults;
};

import { Configuration } from '@appland/client';
import { ScanSummary } from 'src/report/scanSummary';

export default interface ScannerJob {
  id: number;
  created_at: string;
  updated_at: string;
  mapset_id: number;
  merge_key?: string;
  summary: ScanSummary;
  configuration: Configuration;
}

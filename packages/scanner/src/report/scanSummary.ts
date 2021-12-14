import { Metadata } from '@appland/models';

export interface AppMapMetadata {
  labels: string[];
  apps: string[];
  clients: Metadata.Client[];
  frameworks: Metadata.Framework[];
  git: Metadata.Git[];
  languages: Metadata.Language[];
  recorders: Metadata.Recorder[];
  testStatuses: ('succeeded' | 'failed')[];
  exceptions: Metadata.Exception[];
}

export interface ScanSummary {
  numAppMaps: number;
  rules: string[];
  ruleLabels: string[];
  numChecks: number;
  numFindings: number;
  appMapMetadata: AppMapMetadata;
}

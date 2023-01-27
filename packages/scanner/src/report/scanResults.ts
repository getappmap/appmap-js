import { Metadata } from '@appland/models';
import Check from '../check';
import Configuration from '../configuration/types/configuration';
import { Finding } from '../types';
import { AppMapMetadata, ScanSummary } from './scanSummary';
import Telemetry, { Git, GitState } from '../telemetry';

class DistinctItems<T> {
  private members: Record<string, T> = {};

  push(...items: (T | undefined)[]) {
    for (const item of items) {
      if (item === undefined) continue;
      const key = JSON.stringify(item);
      if (!(key in this.members)) this.members[key] = item;
    }
  }

  [Symbol.iterator]() {
    return Object.values(this.members)[Symbol.iterator]();
  }
}

function collectMetadata(metadata: Metadata[]): AppMapMetadata {
  const uniqueApps = new DistinctItems<string>();
  const uniqueLabels = new DistinctItems<string>();
  const uniqueClients = new DistinctItems<Metadata['client']>();
  const uniqueFrameworks = new DistinctItems<Metadata.Framework>();
  const uniqueGit = new DistinctItems<Metadata.Git>();
  const uniqueLanguages = new DistinctItems<Metadata.Language>();
  const uniqueRecorders = new DistinctItems<Metadata.Recorder>();
  const uniqueExceptions = new DistinctItems<Metadata.Exception>();

  for (const item of metadata) {
    uniqueApps.push(item.app);
    uniqueLabels.push(...(item.labels ?? []));
    uniqueClients.push(item.client);
    uniqueFrameworks.push(...(item.frameworks ?? []));
    uniqueGit.push(item.git);
    uniqueLanguages.push(item.language);
    uniqueRecorders.push(item.recorder);
    uniqueExceptions.push(item.exception);
  }
  return {
    labels: [...uniqueLabels],
    apps: [...uniqueApps],
    clients: [...uniqueClients],
    frameworks: [...uniqueFrameworks],
    git: [...uniqueGit],
    languages: [...uniqueLanguages],
    recorders: [...uniqueRecorders],
    testStatuses: [],
    exceptions: [...uniqueExceptions],
  };
}

/**
 * ScannerSummary summarizes the results of the entire scan.
 * It's used for printing a user-friendly summary report, it's not used for machine-readable program output.
 */
export class ScanResults {
  public summary: ScanSummary;

  constructor(
    public configuration: Configuration = { checks: [] },
    public appMapMetadata: Record<string, Metadata> = {},
    public findings: Finding[] = [],
    public checks: Check[] = []
  ) {
    this.summary = {
      numAppMaps: Object.keys(appMapMetadata).length,
      numChecks: checks.length * Object.keys(appMapMetadata).length,
      rules: [...new Set(checks.map((check) => check.rule.id))].sort(),
      ruleLabels: [...new Set(checks.map((check) => check.rule.labels || []).flat())].sort(),
      numFindings: findings.length,
      appMapMetadata: collectMetadata(Object.values(appMapMetadata)),
    };
  }

  withFindings(findings: Finding[]): ScanResults {
    return new ScanResults(this.configuration, this.appMapMetadata, findings, this.checks);
  }

  aggregate(sourceScanResults: ScanResults): void {
    this.summary.numAppMaps += sourceScanResults.summary.numAppMaps;
    this.summary.numChecks += sourceScanResults.summary.numChecks;
    this.summary.rules = [...new Set(this.summary.rules.concat(sourceScanResults.summary.rules))];
    this.summary.ruleLabels = [
      ...new Set(this.summary.ruleLabels.concat(sourceScanResults.summary.ruleLabels)),
    ];
    this.summary.numFindings += sourceScanResults.summary.numFindings;

    // we don't need sourceScanResults.summary.appMetadata
    // appMapMetadata.Git may also contain secrets we don't want to transmit.
  }
}

export type ScanTelemetry = {
  ruleIds: string[];
  numAppMaps: number;
  numFindings: number;
  elapsedMs: number;
  appmapDir?: string;
};

export async function sendScanResultsTelemetry(telemetry: ScanTelemetry): Promise<void> {
  const gitState = GitState[await Git.state(telemetry.appmapDir)];
  const contributors = (await Git.contributors(60, telemetry.appmapDir)).length;
  Telemetry.sendEvent(
    {
      name: 'scan:completed',
      properties: {
        rules: telemetry.ruleIds.sort().join(', '),
        git_state: gitState,
      },
      metrics: {
        duration: telemetry.elapsedMs / 1000,
        numRules: telemetry.ruleIds.length,
        numAppMaps: telemetry.numAppMaps,
        numFindings: telemetry.numFindings,
        contributors: contributors,
      },
    },
    { includeEnvironment: true }
  );
}

import { Metadata } from '@appland/models';
import { Git, GitState, Telemetry, TelemetryData } from '@appland/telemetry';
import Check from '../check';
import Configuration from '../configuration/types/configuration';
import { Finding } from '../index';
import { AppMapMetadata, ScanSummary } from './scanSummary';

/** Tally values in `source` into `target`, summing counts for repeated keys. */
function mergeCounts(target: Record<string, number>, source: Record<string, number>): void {
  for (const [key, count] of Object.entries(source)) {
    target[key] = (target[key] ?? 0) + count;
  }
}

/** Count findings by the value returned from `key`, skipping undefined keys. */
function countFindings(
  findings: Finding[],
  key: (finding: Finding) => string | undefined
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const finding of findings) {
    const value = key(finding);
    if (value === undefined) continue;
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

/**
 * Serialize a counts map to JSON with keys sorted, so the output is deterministic
 * regardless of the order findings were discovered (stable to compare downstream).
 *
 * This relies on JSON.stringify emitting keys in own-property order, which the spec
 * fixes as integer-index keys first, then other string keys in insertion order. Rule
 * IDs and impact domains are never integer-like, so inserting them sorted (via
 * fromEntries) yields sorted JSON. If keys could be integer-like strings, they'd be
 * hoisted ahead of insertion order and this wouldn't hold.
 */
function sortedCountsJson(counts: Record<string, number>): string {
  const sorted = Object.fromEntries(Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)));
  return JSON.stringify(sorted);
}

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
      findingCountsByRule: countFindings(findings, (finding) => finding.ruleId),
      findingCountsByImpactDomain: countFindings(findings, (finding) => finding.impactDomain),
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
    mergeCounts(this.summary.findingCountsByRule, sourceScanResults.summary.findingCountsByRule);
    mergeCounts(
      this.summary.findingCountsByImpactDomain,
      sourceScanResults.summary.findingCountsByImpactDomain
    );

    // we don't need sourceScanResults.summary.appMetadata
    // appMapMetadata.Git may also contain secrets we don't want to transmit.
  }
}

export type ScanTelemetry = {
  ruleIds: string[];
  numAppMaps: number;
  numFindings: number;
  findingCountsByRule: Record<string, number>;
  findingCountsByImpactDomain: Record<string, number>;
  elapsedMs: number;
  appmapDir?: string;
};

/**
 * Build the `scan:completed` telemetry payload. Pure and synchronous: git state and
 * contributor count are resolved by the caller and passed in.
 */
export function scanCompletedEvent(
  telemetry: ScanTelemetry,
  gitState: string,
  contributors: number
): TelemetryData {
  return {
    name: 'scan:completed',
    properties: {
      rules: [...telemetry.ruleIds].sort().join(', '),
      git_state: gitState,
      findingsByRule: sortedCountsJson(telemetry.findingCountsByRule),
      findingsByImpactDomain: sortedCountsJson(telemetry.findingCountsByImpactDomain),
    },
    metrics: {
      duration: telemetry.elapsedMs / 1000,
      numRules: telemetry.ruleIds.length,
      numAppMaps: telemetry.numAppMaps,
      numFindings: telemetry.numFindings,
      contributors,
    },
  };
}

export async function sendScanResultsTelemetry(telemetry: ScanTelemetry): Promise<void> {
  const gitState = GitState[await Git.state(telemetry.appmapDir)];
  const contributors = (await Git.contributors(60, telemetry.appmapDir)).length;
  Telemetry.sendEvent(scanCompletedEvent(telemetry, gitState, contributors));
}

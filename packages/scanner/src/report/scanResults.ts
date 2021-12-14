import { Metadata } from '@appland/models';
import Check from 'src/check';
import Configuration from 'src/configuration/types/configuration';
import { Finding } from 'src/types';
import { AppMapMetadata, ScanSummary } from './scanSummary';

function collectMetadata(metadata: Metadata[]): AppMapMetadata {
  const uniqueApps = new Set();
  const uniqueLabels = new Set();
  const uniqueClients = new Set();
  const uniqueFrameworks = new Set();
  const uniqueGit = new Set();
  const uniqueLanguages = new Set();
  const uniqueRecorders = new Set();
  const uniqueExceptions = new Set();

  function pushDistinctItem(unique: Set<any>, members: Array<any>, item: any | undefined): void {
    if (item === undefined) {
      return;
    }

    const key = JSON.stringify(item);
    if (!unique.has(key)) {
      unique.add(key);
      members.push(item);
    }
  }

  function pushDistinctItems(
    unique: Set<any>,
    members: Array<any>,
    items: any[] | undefined
  ): void {
    (items || []).forEach((item) => pushDistinctItem(unique, members, item));
  }

  return metadata.reduce(
    (memo, appMapMetadata) => {
      pushDistinctItem(uniqueApps, memo.apps, appMapMetadata.app);
      pushDistinctItems(uniqueLabels, memo.labels, appMapMetadata.labels);
      pushDistinctItem(uniqueClients, memo.clients, appMapMetadata.client);
      pushDistinctItems(uniqueFrameworks, memo.frameworks, appMapMetadata.frameworks);
      pushDistinctItem(uniqueGit, memo.git, appMapMetadata.git);
      pushDistinctItem(uniqueLanguages, memo.languages, appMapMetadata.language);
      pushDistinctItem(uniqueRecorders, memo.recorders, appMapMetadata.recorder);
      pushDistinctItem(uniqueExceptions, memo.recorders, appMapMetadata.exception);
      return memo;
    },
    {
      labels: [],
      apps: [],
      clients: [],
      frameworks: [],
      git: [],
      languages: [],
      recorders: [],
      testStatuses: [],
      exceptions: [],
    } as AppMapMetadata
  );
}

/**
 * ScannerSummary summarizes the results of the entire scan.
 * It's used for printing a user-friendly summary report, it's not used for machine-readable program output.
 */
export class ScanResults {
  public summary: ScanSummary;
  public configuration: Configuration;
  public appMaps: Record<string, Metadata>;
  public findings: Finding[];

  constructor(
    configuration: Configuration,
    appMapMetadata: Record<string, Metadata>,
    findings: Finding[],
    checks: Check[]
  ) {
    this.summary = {
      numAppMaps: Object.keys(appMapMetadata).length,
      numChecks: checks.length * Object.keys(appMapMetadata).length,
      rules: [...new Set(checks.map((check) => check.rule.id))].sort(),
      ruleLabels: [...new Set(checks.map((check) => check.rule.labels || []).flat())].sort(),
      numFindings: findings.length,
      appMapMetadata: collectMetadata(Object.values(appMapMetadata)),
    };
    this.configuration = configuration;
    const appMapFiles = new Set(findings.map((finding) => finding.appMapFile));
    this.appMaps = [...appMapFiles].reduce((memo, appMapFile) => {
      memo[appMapFile] = appMapMetadata[appMapFile];
      return memo;
    }, {} as Record<string, Metadata>);
    this.findings = findings;
  }
}

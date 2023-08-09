/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/no-unused-vars */
import LRUCache from 'lru-cache';
import assert from 'assert';
import { readFile } from 'fs/promises';
import { warn } from 'console';
import { buildAppMap } from '@appland/models';

import { loadConfig, parseConfigFile } from './configuration/configurationProvider';
import Configuration from './configuration/types/configuration';
import { default as CheckImpl } from './check';
import { verbose } from './rules/lib/util';
import RuleChecker from './ruleChecker';
import { AppMap, Event } from '@appland/models';
import { MatchResult } from './types';
import { Check, Finding, ScanResults, ScopeName } from './index';
import ProgressReporter from './progressReporter';
import AppMapIndex from './appMapIndex';

const ConfigurationByFileName = new LRUCache<string, Configuration>({ max: 10 });
const ChecksByFileName = new LRUCache<string, CheckImpl[]>({ max: 10 });

class StatsProgressReporter implements ProgressReporter {
  checkStartTime?: Date;
  ruleId?: string;

  parseTime = new Array<number>();
  elapsedByRuleId = new Map<string, number[]>();

  printSummary() {
    if (!verbose()) return;

    if (this.parseTime.length === 0) return;

    const keys = Array.from(this.elapsedByRuleId.keys()).sort();
    console.warn(
      `Average parse time: ${
        this.parseTime.reduce((memo, val) => memo + val, 0) / this.parseTime.length
      }ms`
    );
    for (const key of keys) {
      const elapsed = this.elapsedByRuleId.get(key)!;
      const average = elapsed.reduce((memo, val) => memo + val, 0) / elapsed.length;
      console.warn(`Average check time for ${key}: ${average}ms`);
    }
  }

  addParseTime(elapsed: number) {
    this.parseTime.push(elapsed);
  }

  async beginAppMap(appMapFileName: string, appMap: AppMap) {}
  async beginCheck(check: CheckImpl) {
    this.ruleId = check.rule.id;
    this.checkStartTime = new Date();
  }
  async filterScope(scopeName: ScopeName, scope: Event) {}
  async enterScope(scope: Event) {}
  async filterEvent(event: Event) {}
  async matchResult(event: Event, matchResult: string | boolean | MatchResult[] | undefined) {}
  async matchEvent(event: Event, appMapIndex: AppMapIndex) {}
  async leaveScope() {}
  async endCheck() {
    assert(this.ruleId);
    assert(this.checkStartTime);
    const checkEndTime = new Date();
    const elapsed = checkEndTime.getTime() - this.checkStartTime!.getTime();
    if (!this.elapsedByRuleId.has(this.ruleId)) this.elapsedByRuleId.set(this.ruleId, []);
    this.elapsedByRuleId.get(this.ruleId)!.push(elapsed);
  }
  async endAppMap() {}
}

const STATS_REPORTER = new StatsProgressReporter();

setInterval(() => STATS_REPORTER.printSummary(), 3000);

/**
 * Perform all configured checks on a single AppMap file.
 */
export default async function scan(
  appmapFile: string,
  configurationFile: string
): Promise<ScanResults> {
  let configuration = ConfigurationByFileName.get(configurationFile);
  if (!configuration) {
    if (verbose()) warn(`Loading configuration from ${configurationFile}`);
    configuration = await parseConfigFile(configurationFile);
    ConfigurationByFileName.set(configurationFile, configuration);
  }

  let checkImpls = ChecksByFileName.get(configurationFile);
  if (!checkImpls) {
    if (verbose()) warn(`[scan] Loading checks from ${configurationFile}`);
    checkImpls = await loadConfig(configuration);
    ChecksByFileName.set(configurationFile, checkImpls);
  }

  const checker = new RuleChecker(STATS_REPORTER);

  const findings: Finding[] = [];

  const startTime = new Date();
  const appMapData = await readFile(appmapFile, 'utf8');
  const appMap = buildAppMap(appMapData).normalize().build();
  const parseTime = new Date();

  STATS_REPORTER.addParseTime(parseTime.getTime() - startTime.getTime());
  if (verbose()) console.warn(`[scan] Event count: ${appMap.events.length}`);
  if (verbose()) console.warn(`[scan] Parse time: ${parseTime.getTime() - startTime.getTime()}ms`);

  const appMapIndex = new AppMapIndex(appMap);

  for (const check of checkImpls) {
    await STATS_REPORTER.beginCheck(check);
    await checker.check(appmapFile, appMapIndex, check, findings);
    await STATS_REPORTER.endCheck();
  }

  const scanTime = new Date();
  if (verbose()) console.warn(`[scan] Scan time: ${scanTime.getTime() - parseTime.getTime()}ms`);

  const checks: Check[] = checkImpls.map((check) => ({
    id: check.id,
    scope: check.rule.scope || 'command',
    impactDomain: check.rule.impactDomain || 'Stability',
    rule: {
      id: check.rule.id,
      title: check.rule.title,
      description: check.rule.description,
      url: check.rule.url,
      labels: check.rule.labels || [],
      enumerateScope: check.rule.enumerateScope,
      references: check.rule.references || {},
    },
  }));

  return {
    configuration,
    appMapMetadata: { appmapFile: appMap.metadata },
    findings,
    checks,
  };
}

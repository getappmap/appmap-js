import { join } from 'path';
import assert from 'assert';
import { Finding, ScanResults } from '@appland/scanner';

import { Report } from '../inventory/Report';
import { Reporter, TemplateDirectory } from './Reporter';
import { ReportTemplate } from '../../report/ReportTemplate';
import { AppMap, FindingChange, FindingDiff } from '../compare-report/ChangeReport';
import readIndexFile from '../inventory/readIndexFile';
import loadReportTemplate from '../../report/loadReportTemplate';
import urlHelpers from '../../report/urlHelpers';
import helpers from '../../report/helpers';
import { Rule, SummaryReport } from './SummaryReport';
import { SafeString } from 'handlebars';

async function buildReportData(
  inventoryReport: Report,
  findingLimit: number
): Promise<SummaryReport> {
  const distinctRuleIds = new Set<string>();

  const findingRules = inventoryReport.findings.reduce((acc, f) => {
    if (f.impactDomain && !distinctRuleIds.has(f.ruleId)) {
      distinctRuleIds.add(f.ruleId);
      acc.push({ ruleId: f.ruleId, impactDomain: f.impactDomain });
    }
    return acc;
  }, new Array<Rule>());
  findingRules.sort((a, b) => a.ruleId.localeCompare(b.ruleId));

  const findingRuleCountByImpactDomain = findingRules.reduce((acc, rule) => {
    const { impactDomain: domain } = rule;
    if (domain) {
      if (!acc[domain]) acc[domain] = 1;
      else acc[domain] = acc[domain] + 1;
    }
    return acc;
  }, {});

  const findingCount = inventoryReport.findings.length;
  const findings = inventoryReport.findings.slice(0, findingLimit);

  const scanResultsByAppMap = new Map<string, ScanResults>();
  const loadScanResults = async (appmap: string): Promise<ScanResults> => {
    let scanResults = scanResultsByAppMap.get(appmap);
    if (scanResults) return scanResults;

    scanResults = (await readIndexFile(appmap, 'appmap-findings.json')) as ScanResults;
    scanResultsByAppMap[appmap] = scanResults;
    return scanResults;
  };

  const lookupFinding = async (appmap: string, hash: string): Promise<Finding> => {
    const scanResults = await loadScanResults(appmap);
    const finding = scanResults.findings.find((finding) => finding.hash_v2 === hash);
    assert(finding);
    return finding;
  };

  const newFindings: FindingChange[] = [];
  for (const findingExample of findings) {
    const metadata = await readIndexFile(findingExample.appmap, 'metadata.json');
    const appmap = new AppMap(findingExample.appmap, metadata);
    const finding = await lookupFinding(findingExample.appmap, findingExample.hash_v2);
    newFindings.push({ appmap, finding });
  }

  return {
    findingRules,
    findingRuleCountByImpactDomain,
    findingCount,
    findings: newFindings,
  };
}

export default class SummaryReporter implements Reporter {
  constructor(public appmapURL?: string, public sourceURL?: string) {}

  async generateReport(reportData: Report): Promise<string> {
    assert(TemplateDirectory);
    const templateText = await loadReportTemplate(
      join(TemplateDirectory, 'summary', 'summary.hbs')
    );
    const template = new ReportTemplate(templateText, {
      ...SummaryReporter.helpers(),
      ...helpers,
      ...urlHelpers({ appmapURL: this.appmapURL, sourceURL: this.sourceURL }),
    });

    const report = await buildReportData(reportData, 10);
    return template.generateMarkdown(report);
  }

  static helpers() {
    const rule_url = (rule: string) => {
      return new SafeString(`[${rule}](https://appmap.io/docs/reference/rules/${rule})`);
    };

    const time_ago = (...dates: (Date | string)[]): string => {
      const firstDate = dates.find(Boolean);
      if (!firstDate) return 'an unknown time';

      const date = firstDate instanceof Date ? firstDate : new Date(firstDate);

      // Written by Copilot. Looks right to me.
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      let interval = Math.floor(seconds / 31536000);
      if (interval > 1) return `${interval} years`;
      interval = Math.floor(seconds / 2592000);
      if (interval > 1) return `${interval} months`;
      interval = Math.floor(seconds / 86400);
      if (interval > 1) return `${interval} days`;
      interval = Math.floor(seconds / 3600);
      if (interval > 1) return `${interval} hours`;
      interval = Math.floor(seconds / 60);
      if (interval > 1) return `${interval} minutes`;
      return `${Math.floor(seconds)} seconds`;
    };

    return { rule_url, time_ago };
  }
}

import { ReportOptions } from '../../../src/cmds/compare-report/ReportSection';

export const sourceURL = new URL('file:///Users/joe/dev/appmap-ruby');
export const appmapURL = new URL('https://getappmap.com');
export const reportOptions: ReportOptions = {
  sourceURL,
  appmapURL,
};

export function normalizeReport(report: string): string {
  return report
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

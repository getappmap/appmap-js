import { ReportOptions } from '../../../src/cmds/compare-report/ReportSection';

export const sourceURL = new URL('file:///projects/my-project');
export const appmapURL = new URL('https://getappmap.com');
export const baseDir = '/projects/my-project';
export const reportOptions: ReportOptions = {
  sourceURL,
  appmapURL,
  baseDir,
};

export function normalizeReport(report: string): string {
  return report
    .split('\n')
    .map((line) => line.trim())
    .join('\n');
}

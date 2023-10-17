import assert from 'assert';
import { existsSync, readFileSync } from 'fs';

function removeTimeStampLines(report: string): string {
  return report.replace(/[-+]{3}.*openapi\.yml.*\n/g, '');
}

export default function readReportFile(filePath: string): string {
  assert(existsSync(filePath));
  const lines = readFileSync(filePath, 'utf-8').split(/\r?\n/);
  const removeWhitespaceLines = lines.filter(Boolean).filter((line) => !line.match(/^\s*$/));
  return removeTimeStampLines(removeWhitespaceLines.join('\n'));
}

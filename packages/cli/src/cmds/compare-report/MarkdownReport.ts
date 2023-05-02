import { existsSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import Handlebars from 'handlebars';
import { join } from 'path';
import Report from './Report';
import { ChangeReport } from '../compare/ChangeReport';
import assert from 'assert';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';

const TemplateFile = [
  '../../../resources/change-report.hbs', // As packaged
  '../../../../resources/change-report.hbs', // In development
]
  .map((fileName) => join(__dirname, fileName))
  .find((fileName) => existsSync(fileName));

function isURL(path: string): boolean {
  try {
    new URL(path);
    return true;
  } catch (e) {
    return false;
  }
}

export default class MarkdownReport implements Report {
  async generateReport(changeReport: ChangeReport, baseDir: string): Promise<string> {
    assert(TemplateFile, "Report template file 'change-report.hbs' not found");

    const Template = Handlebars.compile(readFileSync(TemplateFile, 'utf8'));

    // Remove the empty sequence diagram diff snippet - which can't be reasonably rendered.
    delete changeReport.sequenceDiagramDiffSnippets[''];

    // Resolve changedAppMap entry for a test failure. Note that this will not help much
    // with new test cases that fail, but it will help with modified tests that fail.
    changeReport.testFailures.forEach((failure) => {
      const changedAppMap = changeReport.changedAppMaps.find(
        (change) => change.appmap === failure.appmap
      );
      if (changedAppMap) {
        (failure as any).changedAppMap = changedAppMap;
      }
    });

    const appmapNames = new Map<string, string>();
    for (const { appmap } of changeReport.testFailures) {
      const metadata = JSON.parse(await readFile(join('head', appmap, 'metadata.json'), 'utf-8'));
      appmapNames.set(appmap, metadata.name.replace(/_/g, ' '));
    }

    // Resolve the test location to a source path relative to baseDir.
    changeReport.testFailures
      .filter((failure) => failure.testLocation)
      .forEach((failure) => {
        const tokens = failure.testLocation!.split(':');
        tokens.pop();
        let testPath = tokens.join(':');
        let path: string;
        if (isURL(baseDir)) {
          path = new URL(testPath, baseDir).toString();
        } else {
          path = join(baseDir, testPath);
        }
        (failure as any).testPath = path;
        (failure as any).testName = appmapNames.get(failure.appmap) || testPath;

        if (failure.testSnippet) {
          const [, lineno] = (failure.failureLocation || '').split(':');
          (failure as any).failureLine = lineno;
          failure.testSnippet.codeFragment = failure.testSnippet.codeFragment
            .split('\n')
            .map(
              (line, index) =>
                `${(index + failure.testSnippet!.startLine).toString() === lineno ? '> ' : '  '} ${
                  index + failure.testSnippet!.startLine
                }: ${line}`
            )
            .join('\n');
        }
      });

    const wordify = (s: string) => s.replace(/([-_])/g, ' ').toLowerCase();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const explainAPIChange = (change: any) => {
      const { action, entity } = change;
      const entityTokens = entity.split('.');
      change.title = [capitalize(wordify(action)), ...entityTokens.map(wordify)].join(' ');
    };

    if (changeReport.apiDiff) {
      changeReport.apiDiff?.breakingDifferences?.forEach(explainAPIChange);
      changeReport.apiDiff?.nonBreakingDifferences?.forEach(explainAPIChange);
      changeReport.apiDiff?.unclassifiedDifferences?.forEach(explainAPIChange);

      // Provide a simple count of the number of differences - since Handlebars can't do math.
      changeReport.apiDiff.differenceCount =
        (changeReport.apiDiff?.breakingDifferences?.length || 0) +
        (changeReport.apiDiff?.nonBreakingDifferences?.length || 0) +
        (changeReport.apiDiff?.unclassifiedDifferences?.length || 0);
      changeReport.apiDiff.breakingDifferenceCount =
        changeReport.apiDiff?.breakingDifferences?.length || 0;
      changeReport.apiDiff.nonBreakingDifferenceCount =
        changeReport.apiDiff?.nonBreakingDifferences?.length || 0;
      (changeReport as any).sequenceDiagramDiffSnippetCount = Object.keys(
        changeReport.sequenceDiagramDiffSnippets || {}
      ).length;

      if (changeReport.apiDiff.differenceCount > 0) {
        const sourceDiff = (
          await executeCommand(
            `diff -u base/openapi.yml head/openapi.yml`,
            verbose(),
            verbose(),
            verbose(),
            [0, 1]
          )
        ).trim();
        changeReport.apiDiff.sourceDiff = sourceDiff;
      }
    }

    if (Object.keys(changeReport.findingDiff).length) {
      const { findingDiff } = changeReport;

      let newFindings = 0,
        resolvedFindings = 0;
      Object.keys(findingDiff).forEach((findingDomain) => {
        newFindings += findingDiff[findingDomain].new.length;
        resolvedFindings += findingDiff[findingDomain].resolved.length;
      });
      (findingDiff as any).newFindingCount = newFindings;
      (findingDiff as any).resolvedFindingCount = resolvedFindings;
      (findingDiff as any).findingChangeCount = newFindings + resolvedFindings;
    }

    return Template(changeReport);
  }
}

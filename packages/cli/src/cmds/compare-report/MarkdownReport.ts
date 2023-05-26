import { existsSync, readFileSync } from 'fs';
import { readFile } from 'fs/promises';
import Handlebars, { SafeString } from 'handlebars';
import { isAbsolute, join, relative, resolve } from 'path';
import Report from './Report';
import { ChangeReport } from '../compare/ChangeReport';
import assert from 'assert';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';
import { Finding } from '../../lib/findings';

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
  constructor(public appmapURL: URL, public sourceURL: URL) {}

  async generateReport(changeReport: ChangeReport, baseDir: string): Promise<string> {
    assert(TemplateFile, "Report template file 'change-report.hbs' not found");

    const Template = Handlebars.compile(readFileSync(TemplateFile, 'utf8'));

    // Remove the empty sequence diagram diff snippet - which can't be reasonably rendered.
    delete changeReport.sequenceDiagramDiff[''];

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
        changeReport.sequenceDiagramDiff || {}
      ).length;

      Object.keys(changeReport.findingDiff).forEach((key) => {
        changeReport.findingDiff[key].forEach(
          (finding: Finding) => ((finding as any).appmap = finding.appMapFile)
        );
      });

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

    const self = this;

    Handlebars.registerHelper('inspect', function (value: any) {
      return new Handlebars.SafeString(JSON.stringify(value, null, 2));
    });

    Handlebars.registerHelper('length', function (...list): number {
      let result = 0;
      for (const item of list) {
        if (Array.isArray(item)) {
          result += item.length;
        }
      }

      return result;
    });

    Handlebars.registerHelper('has_source_diff', function (appmap): boolean {
      if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, '.appmap.json'.length * -1);
      const changedAppMap = changeReport.changedAppMaps.find((change) => change.appmap === appmap);
      return !!changedAppMap && !!changedAppMap.sourceDiff;
    });

    Handlebars.registerHelper('source_diff', function (appmap: string): SafeString | undefined {
      if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, '.appmap.json'.length * -1);
      const diffText = changeReport.changedAppMaps.find(
        (change) => change.appmap === appmap
      )?.sourceDiff;
      return diffText ? new Handlebars.SafeString(diffText) : undefined;
    });

    Handlebars.registerHelper('appmap_diff_url', function (diagram): SafeString {
      if (diagram.startsWith('./')) diagram = diagram.slice('./'.length);
      if (diagram.startsWith('diff/')) diagram = diagram.slice('diff/'.length);
      if (diagram.endsWith('.diff.sequence.json'))
        diagram = diagram.slice(0, '.diff.sequence.json'.length * -1);
      const path = ['diff', `${diagram}.diff.sequence.json`].join('/');

      if (self.appmapURL) {
        const url = new URL(self.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    });

    Handlebars.registerHelper('appmap_url', function (dir, appmap) {
      if (appmap.startsWith('./')) appmap = appmap.slice('./'.length);
      if (appmap.endsWith('.appmap.json')) appmap = appmap.slice(0, '.appmap.json'.length * -1);
      const path = [dir, `${appmap}.appmap.json`].join('/');

      if (self.appmapURL) {
        const url = new URL(self.appmapURL.toString());
        url.searchParams.append('path', path);
        return new Handlebars.SafeString(url.toString());
      } else {
        return new Handlebars.SafeString(path);
      }
    });

    Handlebars.registerHelper('source_url', function (location, fileLinenoSeparator = '#L') {
      if (typeof fileLinenoSeparator === 'object') {
        fileLinenoSeparator = '#L';
      }

      const [path, lineno] = location.split(':');

      if (isAbsolute(path)) return;
      if (path.startsWith('vendor/') || path.startsWith('node_modules/')) return;

      if (self.sourceURL) {
        const url = new URL(self.sourceURL.toString());
        if (url.protocol === 'file:') {
          const sourcePath = relative(process.cwd(), join(url.pathname, path));
          return new Handlebars.SafeString(
            [sourcePath, lineno].filter(Boolean).join(fileLinenoSeparator)
          );
        } else {
          url.pathname = join(url.pathname, path);
          if (lineno) url.hash = `L${lineno}`;
          return new Handlebars.SafeString(url.toString());
        }
      } else {
        return new Handlebars.SafeString(location);
      }
    });

    return Template(changeReport);
  }
}

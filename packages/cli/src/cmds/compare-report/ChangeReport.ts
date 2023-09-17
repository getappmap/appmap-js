import { Metadata } from '@appland/models';
import { Finding as FindingData } from '@appland/scanner';

import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import { RevisionName } from '../compare/RevisionName';
import assert from 'assert';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';

export class AppMap {
  constructor(public fileName: string, private metadata: Metadata) {}

  get name(): string {
    return this.metadata.name || this.sourceLocation || '<anonymous AppMap>';
  }

  get sourceLocation(): string | undefined {
    return this.metadata.source_location;
  }

  get failureMessage(): string | undefined {
    return this.metadata.test_failure?.message;
  }

  get failureLocation(): string | undefined {
    return this.metadata.test_failure?.location;
  }
}

export class TestFailure {
  // Base properties from Failure
  public testSnippet?: { codeFragment: string; language?: string; startLine: number };
  public testLocation?: string;
  public failureMessage?: string;
  public failureLocation?: string;

  constructor(
    public appmap: AppMap,
    testSnippet?: { codeFragment: string; language?: string; startLine: number },
    public sourceDiff?: string
  ) {
    this.testLocation = appmap.sourceLocation;
    this.failureMessage = appmap.failureMessage;
    this.failureLocation = appmap.failureLocation;

    const { failureLocation } = this.appmap;
    if (this.appmap.failureLocation) {
      if (testSnippet) {
        const [, lineno] = (failureLocation || '').split(':');
        // Insert the line marker '>' into the code fragment.
        const codeFragment = testSnippet.codeFragment
          .split('\n')
          .map(
            (line, index) =>
              `${(index + testSnippet!.startLine).toString() === lineno ? '> ' : '  '} ${
                index + testSnippet!.startLine
              }: ${line}`
          )
          .join('\n');

        this.testSnippet = {
          codeFragment,
          language: testSnippet.language,
          startLine: testSnippet.startLine,
        };
      }
    }
  }
}

export type APIChange = {
  title: string;
  location: string;
  sourceSpecEntityDetails: any;
  destinationSpecEntityDetails: any;
};

export class APIDiff {
  public breakingDifferenceCount: number;
  public nonBreakingDifferenceCount: number;

  public breakingDifferences: APIChange[];
  public nonBreakingDifferences: APIChange[];
  public unclassifiedDifferences: APIChange[];

  constructor(public differenceCount: number, apiDiff: any, public sourceDiff?: string) {
    this.breakingDifferenceCount = apiDiff.breakingDifferences?.length || 0;
    this.nonBreakingDifferenceCount = apiDiff.nonBreakingDifferences?.length || 0;

    const wordify = (s: string) => s.replace(/([-_])/g, ' ').toLowerCase();
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
    const explainAPIChange = (change: any): APIChange => {
      const { action, entity } = change;
      const entityTokens = entity.split('.');
      const title = [capitalize(wordify(action)), ...entityTokens.map(wordify)].join(' ');
      return {
        title,
        location: change.location,
        sourceSpecEntityDetails: change.sourceSpecEntityDetails,
        destinationSpecEntityDetails: change.destinationSpecEntityDetails,
      };
    };

    this.breakingDifferences = apiDiff.breakingDifferences?.map(explainAPIChange);
    this.nonBreakingDifferences = apiDiff.nonBreakingDifferences?.map(explainAPIChange);
    this.unclassifiedDifferences = apiDiff.unclassifiedDifferences?.map(explainAPIChange);
  }
}

export type FindingChange = {
  appmap: AppMap;
  finding: FindingData;
  sourceDiff?: string;
};

export class FindingDiff {
  constructor(public newFindings: FindingChange[], public resolvedFindings: FindingChange[]) {}
}

export default class ChangeReport {
  constructor(
    public testFailures: TestFailure[],
    public apiDiff: APIDiff,
    public findingDiff: FindingDiff
  ) {}

  static async build(changeReportData: ChangeReportData): Promise<ChangeReport> {
    const metadata = (
      revision: RevisionName.Head | RevisionName.Base,
      appmap: string
    ): Metadata => {
      let metadataKey: string;
      if (appmap.endsWith('.appmap.json'))
        metadataKey = appmap.slice(0, '.appmap.json'.length * -1);
      else metadataKey = appmap;
      const metadata = changeReportData.appMapMetadata[revision][metadataKey];
      assert(metadata);
      return metadata;
    };

    const appmap = (revision: RevisionName.Head | RevisionName.Base, appmap: string): AppMap => {
      return new AppMap(appmap, metadata(revision, appmap));
    };

    const sourceDiffs = changeReportData.changedAppMaps.reduce((memo, change) => {
      if (change.sourceDiff) memo.set(change.appmap, change.sourceDiff);
      return memo;
    }, new Map<string, string>());

    // Resolve changedAppMap entry for a test failure. Note that this will not help much
    // with new test cases that fail, but it will help with modified tests that fail.
    const testFailures = changeReportData.testFailures.map((failure) => {
      return new TestFailure(
        appmap(RevisionName.Head, failure.appmap),
        failure.testSnippet,
        sourceDiffs.get(failure.appmap)
        // TODO: Provide sequence diagram diff, if available
      );
    });

    // Remove the empty sequence diagram diff snippet - which can't be reasonably rendered.
    delete changeReportData.sequenceDiagramDiff[''];
    const sequenceDiagramDiffSnippetCount = Object.keys(
      changeReportData.sequenceDiagramDiff || {}
    ).length;

    let apiDiff: APIDiff | undefined;
    if (changeReportData.apiDiff) {
      // Provide a simple count of the number of differences - since Handlebars can't do math.
      const differenceCount =
        (changeReportData.apiDiff.breakingDifferences?.length || 0) +
        (changeReportData.apiDiff.nonBreakingDifferences?.length || 0) +
        (changeReportData.apiDiff.unclassifiedDifferences?.length || 0);

      let sourceDiff: string | undefined;
      if (differenceCount > 0) {
        sourceDiff = (
          await executeCommand(
            `diff -u base/openapi.yml head/openapi.yml`,
            verbose(),
            verbose(),
            verbose(),
            [0, 1]
          )
        ).trim();
      }

      apiDiff = new APIDiff(differenceCount, changeReportData.apiDiff, sourceDiff);
    } else {
      apiDiff = new APIDiff(0, {});
    }

    let findingDiff: FindingDiff | undefined;
    if (changeReportData.findingDiff) {
      const buildFindings = (
        key: 'new' | 'resolved',
        revisionName: RevisionName.Base | RevisionName.Head
      ): FindingChange[] => {
        assert(changeReportData.findingDiff);
        return changeReportData.findingDiff[key].map((finding: FindingData) => ({
          appmap: appmap(revisionName, finding.appMapFile),
          finding,
          sourceDiff: sourceDiffs.get(finding.appMapFile),
        }));
      };

      const newFindings = buildFindings('new', RevisionName.Head);
      const resolvedFindings = buildFindings('resolved', RevisionName.Base);

      findingDiff = new FindingDiff(newFindings, resolvedFindings);
    } else {
      findingDiff = new FindingDiff([], []);
    }

    return new ChangeReport(testFailures, apiDiff, findingDiff);
  }
}

import { Metadata } from '@appland/models';
import { Finding as FindingData } from '@appland/scanner';

import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import { RevisionName } from '../compare/RevisionName';
import assert from 'assert';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';
import { warn } from 'console';
import { ExperimentalSection, Section } from './ReportSection';
import OpenApiDiff from 'openapi-diff';

export class AppMap {
  constructor(
    // id is a unique identifier for the AppMap. It's essentially the path to the AppMap
    // index directory, relative to the appmap_dir. For example, for an AppMap file
    // 'tmp/appmap/minitest/Test_user.appmap.json', the id is 'minitest/Test_user'.;
    public id: string,
    public metadata: Metadata,
    public changed: boolean,
    public sourceDiff: string | undefined
  ) {}

  // Gets the recorder-assigned name for the AppMap. This should be the metadata.name field, which is
  // normally constructed from the name of the test function and its context functions/blocks. If
  // that is missing for some reason, we'll use metadata.source_location.
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
    testSnippet?: { codeFragment: string; language?: string; startLine: number }
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

export class OpenAPIDiff {
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
};

export class FindingDiff {
  constructor(public newFindings: FindingChange[], public resolvedFindings: FindingChange[]) {}
}

export default class ChangeReport {
  constructor(
    public readonly testFailures: TestFailure[],
    public readonly openapiDiff: OpenAPIDiff,
    public readonly findingDiff: FindingDiff,
    public readonly newAppMaps: AppMap[],
    public pruned = false
  ) {}

  static normalizeId(id: string): string {
    let normalizedId = id;
    if (normalizedId.startsWith('./')) normalizedId = normalizedId.slice('./'.length);
    if (normalizedId.endsWith('.appmap.json')) {
      warn(`AppMap id ${id} should not include the file extension`);
      normalizedId = normalizedId.slice(0, '.appmap.json'.length * -1);
    }
    return normalizedId;
  }

  static async build(changeReportData: ChangeReportData): Promise<ChangeReport> {
    const metadata = (
      revision: RevisionName.Head | RevisionName.Base,
      appmap: string
    ): Metadata => {
      const appmapId = this.normalizeId(appmap);
      const metadata = changeReportData.appMapMetadata[revision][appmapId];
      assert(metadata);
      return metadata;
    };

    const changedAppMaps = changeReportData.changedAppMaps.reduce(
      (memo, change) => (memo.add(this.normalizeId(change.appmap)), memo),
      new Set<string>()
    );
    const sourceDiffs = changeReportData.changedAppMaps.reduce((memo, change) => {
      if (change.sourceDiff) memo.set(this.normalizeId(change.appmap), change.sourceDiff);
      return memo;
    }, new Map<string, string>());

    const appmap = (revision: RevisionName.Head | RevisionName.Base, appmapId: string): AppMap => {
      appmapId = this.normalizeId(appmapId);
      const sourceDiff = sourceDiffs.get(appmapId);
      return new AppMap(
        appmapId,
        metadata(revision, appmapId),
        changedAppMaps.has(appmapId),
        sourceDiff
      );
    };

    // Resolve changedAppMap entry for a test failure. Note that this will not help much
    // with new test cases that fail, but it will help with modified tests that fail.
    const testFailures = changeReportData.testFailures.map((failure) => {
      return new TestFailure(appmap(RevisionName.Head, failure.appmap), failure.testSnippet);
    });

    // Remove the empty sequence diagram diff snippet - which can't be reasonably rendered.
    delete changeReportData.sequenceDiagramDiff[''];
    const sequenceDiagramDiffSnippetCount = Object.keys(
      changeReportData.sequenceDiagramDiff || {}
    ).length;

    let apiDiff: OpenAPIDiff | undefined;
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

      apiDiff = new OpenAPIDiff(differenceCount, changeReportData.apiDiff, sourceDiff);
    } else {
      apiDiff = new OpenAPIDiff(0, {}, undefined);
    }

    let findingDiff: FindingDiff | undefined;
    if (changeReportData.findingDiff) {
      const buildFindings = (
        key: 'new' | 'resolved',
        revisionName: RevisionName.Base | RevisionName.Head
      ): FindingChange[] => {
        assert(changeReportData.findingDiff);
        return changeReportData.findingDiff[key].map((finding: FindingData) => ({
          appmap: appmap(revisionName, this.normalizeId(finding.appMapFile)),
          finding,
        }));
      };

      const newFindings = buildFindings('new', RevisionName.Head);
      const resolvedFindings = buildFindings('resolved', RevisionName.Base);

      findingDiff = new FindingDiff(newFindings, resolvedFindings);
    } else {
      findingDiff = new FindingDiff([], []);
    }

    const newAppMaps = changeReportData.newAppMaps.map((appmapId) =>
      appmap(RevisionName.Head, this.normalizeId(appmapId))
    );

    return new ChangeReport(testFailures, apiDiff, findingDiff, newAppMaps);
  }
}

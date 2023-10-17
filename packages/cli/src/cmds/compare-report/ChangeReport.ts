import { Metadata } from '@appland/models';
import { Finding as FindingData } from '@appland/scanner';
import assert from 'assert';
import { format as sqlFormatFn } from 'sql-formatter';

import { ChangeReport as ChangeReportData } from '../compare/ChangeReport';
import { RevisionName } from '../compare/RevisionName';
import { executeCommand } from '../../lib/executeCommand';
import { verbose } from '../../utils';
import normalizeAppMapId from './normalizeAppMapId';

function sqlFormat(query: string): string {
  try {
    return sqlFormatFn(query);
  } catch (e) {
    return query;
  }
}

export class AppMap {
  constructor(
    // id is a unique identifier for the AppMap. It's essentially the path to the AppMap
    // index directory, relative to the appmap_dir. For example, for an AppMap file
    // 'tmp/appmap/minitest/Test_user.appmap.json', the id is 'minitest/Test_user'.;
    public id: string,
    public metadata: Metadata,
    public changed?: boolean | undefined,
    public sourceDiff?: string | undefined
  ) {}

  // Gets the recorder-assigned name for the AppMap. This should be the metadata.name field, which is
  // normally constructed from the name of the test function and its context functions/blocks. If
  // that is missing for some reason, we'll use metadata.source_location.
  get name(): string {
    return this.metadata.name || this.sourceLocation || '<anonymous AppMap>';
  }

  get isTest(): boolean {
    return this.metadata.recorder.type === 'tests' || this.metadata.test_status !== undefined;
  }

  get recorderName(): string | undefined {
    return this.metadata.recorder.name;
  }

  get displayName(): string {
    return this.name.replaceAll(/(\w)_(\w)/g, '$1 $2').replaceAll(/\s+/g, ' ');
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

export type SQLQueryReference = {
  query: string;
  appmaps: AppMap[];
  sourceLocations: string[];
};

export type SQLDiff = {
  newQueries: SQLQueryReference[];
  removedQueries: string[];
  newTables: string[];
  removedTables: string[];
};

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
    public readonly newAppMaps: AppMap[],
    public readonly removedAppMaps: AppMap[],
    public readonly changedAppMaps: Record<string, AppMap[]>,
    public readonly openapiDiff?: OpenAPIDiff,
    public readonly sqlDiff?: SQLDiff,
    public readonly findingDiff?: FindingDiff,
    public pruned = false
  ) {}

  static async build(changeReportData: ChangeReportData): Promise<ChangeReport> {
    const metadata = (
      revision: RevisionName.Head | RevisionName.Base,
      appmap: string
    ): Metadata => {
      const appmapId = normalizeAppMapId(appmap);
      const metadata = changeReportData.appMapMetadata[revision][appmapId];
      if (!metadata) {
        assert(metadata);
      }
      return metadata;
    };

    const changedAppMapSet = changeReportData.changedAppMaps.reduce(
      (memo, change) => (memo.add(normalizeAppMapId(change.appmap)), memo),
      new Set<string>()
    );
    const sourceDiffs = changeReportData.changedAppMaps.reduce((memo, change) => {
      if (change.sourceDiff) memo.set(normalizeAppMapId(change.appmap), change.sourceDiff);
      return memo;
    }, new Map<string, string>());

    const appmap = (revision: RevisionName.Head | RevisionName.Base, appmapId: string): AppMap => {
      appmapId = normalizeAppMapId(appmapId);
      const sourceDiff = sourceDiffs.get(appmapId);
      return new AppMap(
        appmapId,
        metadata(revision, appmapId),
        changedAppMapSet.has(appmapId),
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

    let apiDiff: OpenAPIDiff | undefined;
    if (changeReportData.apiDiff) {
      const differenceCount =
        (changeReportData.apiDiff.breakingDifferencesFound
          ? changeReportData.apiDiff.breakingDifferences?.length
          : 0) +
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
    }

    let findingDiff: FindingDiff | undefined;
    if (changeReportData.findingDiff) {
      const buildFindings = (
        key: 'new' | 'resolved',
        revisionName: RevisionName.Base | RevisionName.Head
      ): FindingChange[] => {
        assert(changeReportData.findingDiff);
        return changeReportData.findingDiff[key].map((finding: FindingData) => {
          // This is a special case where the appmapId in the finding has the .appmap.json
          // extension, which is non-standard from how we do it elsewhere.
          let appmapId = finding.appMapFile;
          if (appmapId.endsWith('.appmap.json'))
            appmapId = appmapId.slice(0, appmapId.length - '.appmap.json'.length);
          return {
            appmap: appmap(revisionName, normalizeAppMapId(appmapId)),
            finding,
          };
        });
      };

      const newFindings = buildFindings('new', RevisionName.Head);
      const resolvedFindings = buildFindings('resolved', RevisionName.Base);

      findingDiff = new FindingDiff(newFindings, resolvedFindings);
    }

    let sqlDiff: SQLDiff | undefined;
    if (changeReportData.sqlDiff) {
      const newQueries: SQLQueryReference[] = changeReportData.sqlDiff.newQueries.map(
        (newQuery) => {
          const appmaps = newQuery.appmaps.map((appmapId) =>
            appmap(RevisionName.Head, normalizeAppMapId(appmapId))
          );
          return {
            query: sqlFormat(newQuery.query),
            appmaps,
            sourceLocations: newQuery.sourceLocations,
          };
        }
      );
      sqlDiff = {
        newQueries,
        removedQueries: changeReportData.sqlDiff.removedQueries.map(sqlFormat),
        newTables: changeReportData.sqlDiff.newTables.map(sqlFormat),
        removedTables: changeReportData.sqlDiff.removedTables.map(sqlFormat),
      };
    } else {
      sqlDiff = { newQueries: [], removedQueries: [], newTables: [], removedTables: [] };
    }

    const newAppMaps = changeReportData.newAppMaps.map((appmapId) =>
      appmap(RevisionName.Head, normalizeAppMapId(appmapId))
    );

    const removedAppMaps = changeReportData.removedAppMaps.map((appmapId) =>
      appmap(RevisionName.Base, normalizeAppMapId(appmapId))
    );

    const changedAppMaps = Object.keys(changeReportData.sequenceDiagramDiff).reduce<
      Record<string, AppMap[]>
    >((memo, key) => {
      const appmaps = changeReportData.sequenceDiagramDiff[key].map((appmapId) =>
        appmap(RevisionName.Head, normalizeAppMapId(appmapId))
      );
      memo[key] = appmaps;
      return memo;
    }, {});

    return new ChangeReport(
      testFailures,
      newAppMaps,
      removedAppMaps,
      changedAppMaps,
      apiDiff,
      sqlDiff,
      findingDiff
    );
  }
}

import { Metadata } from '@appland/models';
import { Finding } from '@appland/scanner';
import OpenApiDiff from 'openapi-diff';

export type AppMapLink = string;
export type SequenceDiagramLink = string;
// AppMap file path, without the .appmap.json extension.
export type AppMapName = string;
// hex digest of an AppMap's canonical sequence diagram.
export type AppMapDigest = string;

export type ChangedAppMap = {
  appmap: string;
  sourceDiff?: string | undefined;
  sequenceDiagramDiff?: SequenceDiagramLink;
};

export type TestFailure = {
  appmap: string;
  name: string;
  testLocation?: string;
  testSnippet?: { codeFragment: string; language?: string; startLine: number };
  failureMessage?: string;
  failureLocation?: string;
};

export type SQLQueryReference = {
  query: string;
  appmaps: string[];
  sourceLocations: string[];
};

export type SQLDiff = {
  newQueries: SQLQueryReference[];
  removedQueries: string[];
  newTables: string[];
  removedTables: string[];
};

export type ChangeReport = {
  testFailures: TestFailure[];
  newAppMaps: AppMapLink[];
  removedAppMaps: AppMapLink[];
  changedAppMaps: ChangedAppMap[];
  apiDiff?: OpenApiDiff.DiffOutcome;
  sqlDiff?: SQLDiff;
  findingDiff?: Record<'new' | 'resolved', Finding[]>;
  appMapMetadata: {
    base: Record<AppMapName, Metadata>;
    head: Record<AppMapName, Metadata>;
  };
  sequenceDiagramDiff: Record<string, AppMapLink[]>;
  warnings?: Record<string, string[]>;
};

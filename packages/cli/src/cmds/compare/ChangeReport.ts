import { Metadata } from '@appland/models';
import { Finding } from '../../lib/findings';

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

export type ChangeReport = {
  testFailures: TestFailure[];
  newAppMaps: AppMapLink[];
  changedAppMaps: ChangedAppMap[];
  newFindings: Finding[];
  resolvedFindings: Finding[];
  apiDiff: any;
  appMapMetadata: {
    base: Record<AppMapName, Metadata>;
    head: Record<AppMapName, Metadata>;
  };
  sequenceDiagramDiffSnippets: Record<string, AppMapLink[]>;
};

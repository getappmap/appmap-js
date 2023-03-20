export type AppMapLink = string;
export type SequenceDiagramLink = string;

export type ChangedAppMap = {
  appmap: string;
  sourceDiff?: string | undefined;
  sequenceDiagramDiff?: SequenceDiagramLink;
};

export type TestFailure = {
  appmap: string;
  changedAppMap?: ChangedAppMap;
  name: string;
  testLocation?: string;
};

export type ChangeReport = {
  testFailures: TestFailure[];
  newAppMaps: AppMapLink[];
  changedAppMaps: ChangedAppMap[];
  sequenceDiagramDiffSnippets: Record<string, AppMapLink[]>;
};

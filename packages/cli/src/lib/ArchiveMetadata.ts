import { AppMapConfig, CompareFilter } from './loadAppMapConfig';

export type ArchiveMetadata = {
  versions: Record<'archive' | 'index' | string, string>;
  workingDirectory: string;
  appMapDir: string;
  commandArguments: Record<string, string | string[]>;
  baseRevision?: string;
  revision: string;
  timestamp: string;
  failedTests?: string[];
  oversizedAppMaps?: string[];
  deletedAppMaps?: string[];
  config: AppMapConfig;
};

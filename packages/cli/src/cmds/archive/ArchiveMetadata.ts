import { AppMapConfig } from '../../lib/loadAppMapConfig';

export type ArchiveMetadata = {
  versions: Record<'archive' | 'index' | string, string>;
  workingDirectory: string;
  appMapDir: string;
  commandArguments: Record<string, string | string[]>;
  baseRevision?: string;
  revision: string;
  timestamp: string;
  oversizedAppMaps?: string[];
  deletedAppMaps?: string[];
  config: AppMapConfig;
  appMapFilter: Record<string, any>;
};

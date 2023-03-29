import { AppMapConfig } from '../../lib/loadAppMapConfig';

export type Metadata = {
  versions: Record<string, string>;
  workingDirectory: string;
  appMapDir: string;
  commandArguments: Record<string, string | string[]>;
  baseRevision?: string;
  revision: string;
  timestamp: string;
  oversizedAppMaps: string[];
  deletedAppMaps?: string[];
  config: AppMapConfig;
};

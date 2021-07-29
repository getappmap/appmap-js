export interface AppMapMetadata {
  name: string;
  fingerprints: Fingerprint[];
}

export interface AppMapListItem {
  scenario_uuid: string;
  metadata: AppMapMetadata;
}

export interface AppMapData {
  version: string;
  metadata: object;
  classMap: object[];
  events: object[];
}

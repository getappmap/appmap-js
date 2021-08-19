export interface Fingerprint {
  appmap_digest: string;
  canonicalization_algorithm: string;
  digest: string;
  fingerprint_algorithm: string;
}

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

interface AppMapMetadata {
  name: string;
  fingerprints: Fingerprint[];
}

interface AppMapListItem {
  scenario_uuid: string;
  metadata: AppMapMetadata;
}

interface AppMapData {
  version: string;
  metadata: object;
  classMap: object[];
  events: object[];
}

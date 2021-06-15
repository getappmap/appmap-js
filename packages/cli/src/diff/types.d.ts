import { HTTPRequest, HTTPRoute } from '../search/types';
import { SQL } from '../inspect/types';

interface Context {}

interface AppLandConfig {
  current_context: string;
  contexts: { string: Context };
}

interface Fingerprint {
  canonicalization_algorithm: string;
  digest: string;
}

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

interface Event {
  appMapName: string;
  eventId: int;
}

enum Status {
  Added,
}

interface DiffEntry {
  events: Event[];
  status: Status;
}

interface TableDiffEntry extends DiffEntry {
  tableName: string;
}

interface SQLDiffEntry extends DiffEntry {
  sql: SQL;
}

interface LabelDiffEntry extends DiffEntry {
  label: string;
}

interface HTTPRouteDiffEntry extends DiffEntry {
  route: HTTPRoute;
}

interface HTTPRequestDiffEntry extends DiffEntry {
  request: HTTPRequest;
}

interface MapsetDiff {
  tables: TableDiffEntry[];
  columns: ColumnDiffEntry[];
  sql: SQLDiffEntry[];
  labels: LabelDiffEntry[];
  httpRoutes: HTTPRouteDiffEntry;
  httpRequests: HTTPRequestDiffEntry;
}

interface MapsetAppMap {
  name: string;
  fingerprint: function(string): string;
  loadAppMapData: function(): AppMapData;
}

interface MapsetProvider {
  appMaps: function(): MapsetAppMap[];
}
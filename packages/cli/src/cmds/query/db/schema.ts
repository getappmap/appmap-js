// SQLite schema for AppMap APM data.
//
// Denormalizes AppMap events into APM-oriented tables optimized for the
// queries an APM dashboard or LLM agent needs. Ported from appmap-apm
// (server/db/schema.py); shape preserved unchanged.

export const SCHEMA_VERSION = 5;

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS appmaps (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    source_path     TEXT NOT NULL UNIQUE,
    language        TEXT,
    framework       TEXT,
    recorder_type   TEXT,
    git_repository  TEXT,
    git_branch      TEXT,
    git_commit      TEXT,
    timestamp       TEXT,
    event_count     INTEGER NOT NULL DEFAULT 0,
    sql_query_count INTEGER NOT NULL DEFAULT 0,
    http_request_count INTEGER NOT NULL DEFAULT 0,
    elapsed_ms      REAL,
    metadata_labels TEXT  -- JSON array of metadata-level labels
);

-- Code objects from classMap entries (one per unique instrumented function).
-- A lookup table for stable fqids. Components are stored separately so
-- filters can match exactly without parsing the fqid string:
--   package     slash-joined package path  ('' for top-level fn)
--   classes     JSON array of class names  ('[]' for package-level fn)
--   leaf_class  last element of classes, denormalized for fast lookup
--               on short-form filters like --class Cipher (matches both
--               top-level Cipher and OpenSSL::Cipher).
--   method      leaf method name
--   is_static   1 for static / class methods, 0 for instance methods
-- The fqid is always derivable from these (package + cls-chain + (#|.) +
-- method); we keep it as a stored column for output ergonomics and
-- uniqueness enforcement.
--
-- This table intentionally does NOT store path/lineno/location, because
-- those vary across recordings of the same code (different branches or
-- revisions). Per-recording location data lives on function_calls.
CREATE TABLE IF NOT EXISTS code_objects (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    fqid            TEXT NOT NULL UNIQUE,
    package         TEXT NOT NULL,
    classes         TEXT NOT NULL,
    leaf_class      TEXT NOT NULL,
    method          TEXT NOT NULL,
    is_static       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS http_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    appmap_id       INTEGER NOT NULL REFERENCES appmaps(id) ON DELETE CASCADE,
    event_id        INTEGER NOT NULL,
    thread_id       INTEGER,
    parent_event_id INTEGER,
    method          TEXT NOT NULL,
    path            TEXT NOT NULL,
    normalized_path TEXT,
    protocol        TEXT,
    status_code     INTEGER NOT NULL,
    mime_type       TEXT,
    elapsed_ms      REAL
    -- Note: no per-row timestamp. Time range queries JOIN to appmaps and
    -- filter on appmaps.timestamp (the recording-level value).
);

CREATE TABLE IF NOT EXISTS http_client_requests (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    appmap_id       INTEGER NOT NULL REFERENCES appmaps(id) ON DELETE CASCADE,
    event_id        INTEGER NOT NULL,
    thread_id       INTEGER,
    parent_event_id INTEGER,
    method          TEXT NOT NULL,
    url             TEXT NOT NULL,
    status_code     INTEGER,
    elapsed_ms      REAL
);

CREATE TABLE IF NOT EXISTS sql_queries (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    appmap_id       INTEGER NOT NULL REFERENCES appmaps(id) ON DELETE CASCADE,
    event_id        INTEGER NOT NULL,
    thread_id       INTEGER,
    parent_event_id INTEGER,
    sql_text        TEXT NOT NULL,
    database_type   TEXT,
    server_version  TEXT,
    caller_class    TEXT,
    caller_method   TEXT,
    elapsed_ms      REAL
);

CREATE TABLE IF NOT EXISTS function_calls (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    appmap_id       INTEGER NOT NULL REFERENCES appmaps(id) ON DELETE CASCADE,
    event_id        INTEGER NOT NULL,
    thread_id       INTEGER,
    parent_event_id INTEGER,
    code_object_id  INTEGER REFERENCES code_objects(id),
    defined_class   TEXT NOT NULL,
    method_id       TEXT NOT NULL,
    path            TEXT,
    lineno          INTEGER,
    is_static       INTEGER NOT NULL DEFAULT 0,
    elapsed_ms      REAL,
    parameters_json TEXT,   -- JSON of parameter values (for labeled/log functions)
    return_value    TEXT    -- string repr of return value (for labeled/log functions)
);

CREATE TABLE IF NOT EXISTS exceptions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    appmap_id       INTEGER NOT NULL REFERENCES appmaps(id) ON DELETE CASCADE,
    -- event_id is the call event id (the call this exception belongs to);
    -- return_event_id is the return event id (where the throw materialized in
    -- the event stream). Use return_event_id for ordering — e.g. the
    -- with_logs neighborhood query (what did the app log before the throw?)
    -- needs to include logs that fired *inside* the throwing call, which all
    -- have event_id greater than the call entry id but less than the return.
    event_id        INTEGER,
    return_event_id INTEGER,
    thread_id       INTEGER,
    parent_event_id INTEGER,
    exception_class TEXT NOT NULL,
    message         TEXT,
    path            TEXT,
    lineno          INTEGER
);

-- Labels from classMap function entries (log, security.*, etc.)
CREATE TABLE IF NOT EXISTS labels (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    code_object_id  INTEGER NOT NULL REFERENCES code_objects(id),
    label           TEXT NOT NULL,
    UNIQUE(code_object_id, label)
);

-- Indexes for common APM queries
CREATE INDEX IF NOT EXISTS idx_http_requests_appmap ON http_requests(appmap_id);
CREATE INDEX IF NOT EXISTS idx_http_requests_path ON http_requests(normalized_path, method);
CREATE INDEX IF NOT EXISTS idx_http_requests_status ON http_requests(status_code);
CREATE INDEX IF NOT EXISTS idx_http_client_requests_appmap ON http_client_requests(appmap_id);
CREATE INDEX IF NOT EXISTS idx_sql_queries_appmap ON sql_queries(appmap_id);
CREATE INDEX IF NOT EXISTS idx_sql_queries_elapsed ON sql_queries(elapsed_ms DESC);
CREATE INDEX IF NOT EXISTS idx_function_calls_appmap ON function_calls(appmap_id);
CREATE INDEX IF NOT EXISTS idx_function_calls_appmap_event ON function_calls(appmap_id, event_id);
CREATE INDEX IF NOT EXISTS idx_function_calls_class_method ON function_calls(defined_class, method_id);
CREATE INDEX IF NOT EXISTS idx_function_calls_code_object ON function_calls(code_object_id);
CREATE INDEX IF NOT EXISTS idx_function_calls_parent ON function_calls(appmap_id, parent_event_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_appmap ON exceptions(appmap_id);
CREATE INDEX IF NOT EXISTS idx_exceptions_class ON exceptions(exception_class);
CREATE INDEX IF NOT EXISTS idx_code_objects_fqid ON code_objects(fqid);
CREATE INDEX IF NOT EXISTS idx_code_objects_leaf_class ON code_objects(leaf_class);
CREATE INDEX IF NOT EXISTS idx_code_objects_method ON code_objects(method);
CREATE INDEX IF NOT EXISTS idx_code_objects_leaf_method ON code_objects(leaf_class, method);
CREATE INDEX IF NOT EXISTS idx_labels_label ON labels(label);
CREATE INDEX IF NOT EXISTS idx_labels_code_object ON labels(code_object_id);
CREATE INDEX IF NOT EXISTS idx_appmaps_timestamp ON appmaps(timestamp);
CREATE INDEX IF NOT EXISTS idx_appmaps_branch ON appmaps(git_branch);
`;

// Names of all schema tables (used by the version-mismatch teardown path).
export const SCHEMA_TABLES = [
  'appmaps',
  'code_objects',
  'http_requests',
  'http_client_requests',
  'sql_queries',
  'function_calls',
  'exceptions',
  'labels',
];

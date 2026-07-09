import { normalizeSQL } from '@appland/models';

// Sanitize an AppMap so its committed form is structurally incapable of
// carrying a secret. Every captured runtime value string is replaced with a
// per-AppMap token (`<v1>`, `<v2>`, …) assigned in order of first appearance,
// so equality WITHIN one AppMap is preserved exactly (data-flow correlation
// still reads), while no content characters are retained. Tokens are shared
// across all value positions, so a header value, a parameter, and a return
// value that held the same string get the same token.
//
// Sanitization is positional, driven by the AppMap format: it touches only
// the fields defined to hold captured runtime data. Code object names,
// classes, paths, labels, and route templates are schema, not data, and are
// never modified.
//
// This trades away cross-AppMap comparison of values (each file has its own
// token namespace) — deliberately: the comparison digest excludes values, and
// unlinkability across files/revisions is the anti-correlation guarantee.

// Kind recognizers annotate a token with the *shape* of the original value
// (`<uuid:v3>`) — readability only. Recognition never exempts a value from
// sanitization: a UUID is exactly the shape session tokens take.
const KIND_PATTERNS: [string, RegExp][] = [
  ['uuid', /^\{?[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\}?$/],
  ['iso8601', /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/],
  ['hex', /^(0x)?[0-9a-fA-F]{16,}$/],
  ['int', /^-?\d+$/],
];

// An already-assigned token passes through unchanged, making sanitization
// idempotent — re-running it on a sanitized AppMap is byte-identical.
const TOKEN_PATTERN = /^<(?:[a-z0-9]+:)?v\d+>$/;

// Values kept verbatim: universally enumerable sets with no secret capacity.
// Project-specific vocabularies (enum strings such as state names) are added
// via the command's --allow/--allow-file options — curated by a human, exact
// match only. Matching never keeps part of a value.
export const BUILTIN_ALLOW: ReadonlySet<string> = new Set([
  '',
  'true',
  'false',
  'True',
  'False',
  'TRUE',
  'FALSE',
  'null',
  'NULL',
  'nil',
  'None',
  'undefined',
]);

export class ValueMasker {
  private tokens = new Map<string, string>();

  private counter = 0;

  constructor(private allow: ReadonlySet<string> = BUILTIN_ALLOW) {}

  get distinctCount(): number {
    return this.tokens.size;
  }

  // Start numbering new tokens above `n`. Used when a document already carries
  // tokens (sanitized before this code covered some field): a new value must
  // never receive a token that another value in the document already holds.
  reserveThrough(n: number): void {
    this.counter = Math.max(this.counter, n);
  }

  // The masking primitive: every captured value string passes through here
  // and is replaced with a content-free token (allow-list and
  // already-assigned tokens excepted). Labeled so appmap-review interprets
  // changes to what escapes masking.
  // @label security.sanitization
  mask(value: string): string {
    if (this.allow.has(value) || TOKEN_PATTERN.test(value)) return value;
    let token = this.tokens.get(value);
    if (!token) {
      const kind = KIND_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0];
      this.counter += 1;
      token = `<${kind ? `${kind}:` : ''}v${this.counter}>`;
      this.tokens.set(value, token);
    }
    return token;
  }
}

// SQL is parameterized, not tokenized: the statement shape is behavioral
// signal the review reads; the literals are where secrets/PII live.
// normalizeSQL (the New Relic obfuscator) replaces literals with `?` — but on
// a statement it cannot reliably obfuscate it returns the ORIGINAL, which is
// fail-open. Sanitization must fail closed, so any residue that suggests an
// unobfuscated literal downgrades the whole statement to a token.
// Residue patterns per adapter follow the obfuscator's own cleanup table
// (double quotes are string literals in MySQL but identifiers in Postgres).
const SQL_RESIDUE: Record<string, RegExp> = {
  mysql: /'|"|\/\*|\*\//,
  mysql2: /'|"|\/\*|\*\//,
  postgres: /'|\/\*|\*\/|\$(?!\?)/,
  sqlite: /'|\/\*|\*\//,
  cassandra: /'|\/\*|\*\//,
  oracle: /'|\/\*|\*\//,
  oracle_enhanced: /'|\/\*|\*\//,
};
const SQL_RESIDUE_DEFAULT = /'|"|\/\*|\*\//;

// @label security.sanitization
function sanitizeSql(sql: string, adapter: string | undefined, masker: ValueMasker): string {
  if (TOKEN_PATTERN.test(sql)) return sql;
  const normalized = normalizeSQL(sql, adapter ?? '');
  const residue = (adapter && SQL_RESIDUE[adapter]) || SQL_RESIDUE_DEFAULT;
  if (residue.test(normalized)) return masker.mask(sql);
  return normalized;
}

// The captured `value` of a parameter, message param, receiver, or return value.
interface ValueSlot {
  value?: unknown;
}

interface ExceptionSlot {
  message?: unknown;
  value?: unknown;
}

interface HttpServerRequest {
  path_info?: unknown;
  normalized_path_info?: unknown;
  headers?: Record<string, unknown>;
}

interface HttpClientRequest {
  url?: unknown;
  headers?: Record<string, unknown>;
}

interface HttpResponse {
  headers?: Record<string, unknown>;
}

interface SqlQuery {
  sql?: unknown;
  database_type?: string;
}

interface AppMapEvent {
  parameters?: ValueSlot[];
  message?: ValueSlot[];
  receiver?: ValueSlot;
  return_value?: ValueSlot;
  exceptions?: ExceptionSlot[];
  http_server_request?: HttpServerRequest;
  http_client_request?: HttpClientRequest;
  http_server_response?: HttpResponse;
  http_client_response?: HttpResponse;
  sql_query?: SqlQuery;
}

interface AppMap {
  events?: AppMapEvent[];
  // Late updates to events, keyed by event id — e.g. a promise's return value,
  // filled in after the call event was written. Same shape as an event.
  eventUpdates?: Record<string, AppMapEvent>;
}

function sanitizeSlot(slot: ValueSlot | undefined, masker: ValueMasker): void {
  if (slot && typeof slot.value === 'string') slot.value = masker.mask(slot.value);
}

// Header NAMES are schema (kept); header VALUES are captured data (tokenized).
function sanitizeHeaders(headers: Record<string, unknown> | undefined, masker: ValueMasker): void {
  if (!headers) return;
  for (const name of Object.keys(headers)) {
    const value = headers[name];
    if (typeof value === 'string') headers[name] = masker.mask(value);
  }
}

// The redaction boundary: sanitizes every field defined to hold captured
// runtime data (parameters, return values, exceptions, HTTP paths/headers,
// SQL) so the committed AppMap is structurally incapable of carrying a secret.
// Labeled so appmap-review interprets any change to this boundary.
// @label security.sanitization
const TOKEN_SCAN = /<(?:[a-z0-9]+:)?v(\d+)>/g;

export function sanitizeAppMap(
  appmap: AppMap,
  masker: ValueMasker = new ValueMasker()
): AppMap {
  // If the document already carries tokens (sanitized by an earlier version of
  // this walk), number new tokens above them so no token is ever shared by
  // two different values.
  for (const match of JSON.stringify(appmap).matchAll(TOKEN_SCAN)) {
    masker.reserveThrough(Number(match[1]));
  }
  for (const event of appmap.events ?? []) sanitizeEvent(event, masker);
  // eventUpdates carry the same captured-data fields as events; sanitize them
  // in place, in the same token namespace. They are deliberately not merged
  // into their events — sanitize changes values only, never structure.
  for (const update of Object.values(appmap.eventUpdates ?? {})) sanitizeEvent(update, masker);
  return appmap;
}

function sanitizeEvent(event: AppMapEvent, masker: ValueMasker): void {
  for (const p of event.parameters ?? []) sanitizeSlot(p, masker);
  for (const m of event.message ?? []) sanitizeSlot(m, masker);
  sanitizeSlot(event.receiver, masker);
  sanitizeSlot(event.return_value, masker);

  for (const x of event.exceptions ?? []) {
    if (typeof x.message === 'string') x.message = masker.mask(x.message);
    if (typeof x.value === 'string') x.value = masker.mask(x.value);
  }

  const serverRequest = event.http_server_request;
  if (serverRequest) {
    // The concrete path carries path params (ids, PII); the normalized
    // route template is the interesting part and stays.
    if (typeof serverRequest.path_info === 'string')
      serverRequest.path_info = masker.mask(serverRequest.path_info);
    sanitizeHeaders(serverRequest.headers, masker);
  }
  const clientRequest = event.http_client_request;
  if (clientRequest) {
    if (typeof clientRequest.url === 'string')
      clientRequest.url = masker.mask(clientRequest.url);
    sanitizeHeaders(clientRequest.headers, masker);
  }
  sanitizeHeaders(event.http_server_response?.headers, masker);
  sanitizeHeaders(event.http_client_response?.headers, masker);

  const sqlQuery = event.sql_query;
  if (sqlQuery && typeof sqlQuery.sql === 'string')
    sqlQuery.sql = sanitizeSql(sqlQuery.sql, sqlQuery.database_type, masker);
}

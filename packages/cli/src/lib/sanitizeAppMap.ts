import { normalizeSQL } from '@appland/models';

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const CLI_VERSION: string = require('../../package.json').version;

// Sanitize an AppMap so its committed form is structurally incapable of
// carrying a secret. Every captured runtime value string is replaced with a
// per-AppMap token (`<v1>`, `<v2>`, …) assigned in order of first appearance,
// so equality WITHIN one AppMap is preserved exactly (data-flow correlation
// still reads), while no content characters are retained. Tokens are shared
// across all value positions, so a header value, a parameter, and a return
// value that held the same string get the same token.
//
// Two fields are the exception: an HTTP server `path_info` with no route
// template, and a client `url`. These are the only captured values that feed
// the `appmap compare` digest (through the request route), so a per-file token
// would make two otherwise-identical recordings compare as different. They are
// instead normalized to a deterministic, lossy route template (see
// normalizeUrl) — stable across files, with the concrete id dropped rather than
// encoded. (A content hash would give cross-file stability for free, but a hash
// of low-entropy PII is reversible by guess-and-check; erasure is not.)
//
// Sanitization is positional, driven by the AppMap format: it touches only
// the fields defined to hold captured runtime data. Code object names,
// classes, paths, labels, and route templates are schema, not data, and are
// never modified.
//
// The per-file token namespace is deliberate: unlinkability across
// files/revisions is the anti-correlation guarantee, and (routes aside) values
// are excluded from the comparison digest, so nothing is lost by it.

// Kind recognizers annotate a token with the *shape* of the original value
// (`<uuid:v3>`) — readability only. Recognition never exempts a value from
// sanitization: a UUID is exactly the shape session tokens take.
const KIND_PATTERNS: [string, RegExp][] = [
  ['uuid', /^\{?[0-9a-fA-F]{8}-(?:[0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}\}?$/],
  ['iso8601', /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/],
  ['hex', /^(0x)?[0-9a-fA-F]{16,}$/],
  ['int', /^-?\d+$/],
];

// The shape of an assigned token. Recognition of existing tokens is gated on
// the file's metadata.sanitized marker: in a marked file the tokens are ours
// and pass through (making re-runs idempotent); in a fresh file a string that
// merely looks like a token is application data and is masked like any other.
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

  // Set by sanitizeAppMap when the file carries a metadata.sanitized marker.
  recognizeTokens = false;

  constructor(private allow: ReadonlySet<string> = BUILTIN_ALLOW) {}

  get distinctCount(): number {
    return this.tokens.size;
  }

  // The user-supplied allowlist (built-ins excluded), for the provenance marker.
  get userAllowValues(): string[] {
    return [...this.allow].filter((v) => !BUILTIN_ALLOW.has(v)).sort();
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
    if (this.allow.has(value) || (this.recognizeTokens && TOKEN_PATTERN.test(value))) return value;
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
  if (masker.recognizeTokens && TOKEN_PATTERN.test(sql)) return sql;
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

export interface SanitizedMarker {
  version: string;
  allow_values: string[];
}

interface GitMetadata {
  repository?: unknown;
  user_name?: unknown;
  user_email?: unknown;
  [key: string]: unknown;
}

interface AppMapMetadata {
  sanitized?: SanitizedMarker;
  git?: GitMetadata;
  exception?: { message?: unknown; [key: string]: unknown };
  test_failure?: { message?: unknown; [key: string]: unknown };
  [key: string]: unknown;
}

interface AppMap {
  metadata?: AppMapMetadata;
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

// HTTP paths and client URLs are the one kind of captured value that feeds the
// `appmap compare` digest: the request route is derived from `path_info`/`url`
// (Event.route). A per-file `<vN>` token there would vary between recordings
// and destabilize the digest, so instead of tokenizing we normalize to a route
// template — deterministic (same input, same output, so the digest is stable
// across files) and lossy (the concrete id is dropped, not encoded, so there is
// nothing to reverse).
//
// A segment that looks like a value (numeric/uuid/hex/timestamp id) becomes a
// `:kind` placeholder; a plain route word or version segment is kept; anything
// else (mixed-alnum ids, opaque tokens, emails) falls to `:param`. Without the
// application's route table this is a heuristic: a purely alphabetic segment
// (a username in `/users/alice`) is indistinguishable from a route word and is
// kept — the one spot a template-less path can retain a value.
function normalizeSegment(seg: string): string {
  if (seg === '') return seg; // preserve leading/trailing/'//' structure
  const kind = KIND_PATTERNS.find(([, pattern]) => pattern.test(seg))?.[0];
  if (kind) return `:${kind}`;
  if (/^[A-Za-z][A-Za-z_-]*$/.test(seg) || /^v\d+$/.test(seg)) return seg;
  return ':param';
}

// Drop the query string and fragment entirely: they are the densest home for
// secrets and PII (tokens, emails, ids as `?user=…`) and carry little route
// signal, so dropping them is both the safest and simplest choice. (A later
// revision could instead keep sorted parameter *names* with erased values, if
// query-distinguished endpoints ever need to compare apart.)
// @label security.sanitization
function normalizePath(path: string): string {
  return path.split(/[?#]/)[0].split('/').map(normalizeSegment).join('/');
}

// Client URL: strip userinfo (a `user:pass@` can ride here as in a git URL),
// keep scheme + host + port as route signal, parameterize the path, drop query
// and fragment. A relative or malformed URL that won't parse is parameterized
// as a bare path — deterministic and secret-free, never fail-open.
// @label security.sanitization
function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${normalizePath(parsed.pathname)}`;
  } catch {
    return normalizePath(url);
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
  const prior = appmap.metadata?.sanitized;
  masker.recognizeTokens = Boolean(prior);
  if (prior) {
    // The document's tokens are ours: number new tokens above them so no
    // token is ever shared by two different values.
    for (const match of JSON.stringify(appmap).matchAll(TOKEN_SCAN)) {
      masker.reserveThrough(Number(match[1]));
    }
  }
  for (const event of appmap.events ?? []) sanitizeEvent(event, masker);
  // eventUpdates carry the same captured-data fields as events; sanitize them
  // in place, in the same token namespace. They are deliberately not merged
  // into their events — sanitize changes values only, never structure.
  for (const update of Object.values(appmap.eventUpdates ?? {})) sanitizeEvent(update, masker);
  sanitizeMetadata(appmap.metadata, masker);

  // Provenance. Masking is one-way, so on a re-run the values still verbatim
  // are those allowed by BOTH runs — the marker records that intersection.
  const current = masker.userAllowValues;
  const allowValues = prior
    ? current.filter((v) => prior.allow_values.includes(v))
    : current;
  appmap.metadata = {
    ...(appmap.metadata ?? {}),
    sanitized: { version: CLI_VERSION, allow_values: allowValues },
  };
  return appmap;
}

// Metadata carries captured data too: the git identity, credentials embedded
// in the repository URL, and exception / test-failure messages. The command
// pipeline's normalize step also strips repository credentials, but the walk
// must not depend on it — the security guarantee lives here, alone.
function sanitizeMetadata(metadata: AppMapMetadata | undefined, masker: ValueMasker): void {
  if (!metadata) return;
  const git = metadata.git;
  if (git) {
    if (typeof git.repository === 'string' && /^https?:/.test(git.repository)) {
      const repository = git.repository;
      try {
        const url = new URL(repository);
        url.username = '';
        url.password = '';
        git.repository = url.toString();
      } catch {
        // Unparseable URL: mask the whole value rather than risk a credential.
        git.repository = masker.mask(repository);
      }
    }
    if (typeof git.user_name === 'string') git.user_name = masker.mask(git.user_name);
    if (typeof git.user_email === 'string') git.user_email = masker.mask(git.user_email);
  }
  if (metadata.exception && typeof metadata.exception.message === 'string')
    metadata.exception.message = masker.mask(metadata.exception.message);
  if (metadata.test_failure && typeof metadata.test_failure.message === 'string')
    metadata.test_failure.message = masker.mask(metadata.test_failure.message);
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
    // path_info carries the concrete path (ids, PII). When a route template
    // (normalized_path_info) is present it wins the digest, so the concrete
    // path is not structural and we fully redact it to a token. When it is
    // absent, path_info IS the digest's route, so normalize it to a
    // deterministic template instead — a per-file token there would vary
    // between recordings and destabilize `appmap compare`.
    if (typeof serverRequest.path_info === 'string')
      serverRequest.path_info = serverRequest.normalized_path_info
        ? masker.mask(serverRequest.path_info)
        : normalizePath(serverRequest.path_info);
    sanitizeHeaders(serverRequest.headers, masker);
  }
  const clientRequest = event.http_client_request;
  if (clientRequest) {
    // The client URL always feeds the ClientRPC route/digest, so normalize it
    // to a route template rather than tokenize it (see normalizeUrl).
    if (typeof clientRequest.url === 'string')
      clientRequest.url = normalizeUrl(clientRequest.url);
    sanitizeHeaders(clientRequest.headers, masker);
  }
  sanitizeHeaders(event.http_server_response?.headers, masker);
  sanitizeHeaders(event.http_client_response?.headers, masker);

  const sqlQuery = event.sql_query;
  if (sqlQuery && typeof sqlQuery.sql === 'string')
    sqlQuery.sql = sanitizeSql(sqlQuery.sql, sqlQuery.database_type, masker);
}

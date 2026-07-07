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
]);

export class ValueTokenizer {
  private tokens = new Map<string, string>();

  constructor(private allow: ReadonlySet<string> = BUILTIN_ALLOW) {}

  get distinctCount(): number {
    return this.tokens.size;
  }

  tokenize(value: string): string {
    if (this.allow.has(value) || TOKEN_PATTERN.test(value)) return value;
    let token = this.tokens.get(value);
    if (!token) {
      const kind = KIND_PATTERNS.find(([, pattern]) => pattern.test(value))?.[0];
      token = `<${kind ? `${kind}:` : ''}v${this.tokens.size + 1}>`;
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

function sanitizeSql(sql: string, adapter: string | undefined, tokenizer: ValueTokenizer): string {
  if (TOKEN_PATTERN.test(sql)) return sql;
  const normalized = normalizeSQL(sql, adapter ?? '');
  const residue = (adapter && SQL_RESIDUE[adapter]) || SQL_RESIDUE_DEFAULT;
  if (residue.test(normalized)) return tokenizer.tokenize(sql);
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
}

function sanitizeSlot(slot: ValueSlot | undefined, tokenizer: ValueTokenizer): void {
  if (slot && typeof slot.value === 'string') slot.value = tokenizer.tokenize(slot.value);
}

// Header NAMES are schema (kept); header VALUES are captured data (tokenized).
function sanitizeHeaders(headers: Record<string, unknown> | undefined, tokenizer: ValueTokenizer): void {
  if (!headers) return;
  for (const name of Object.keys(headers)) {
    const value = headers[name];
    if (typeof value === 'string') headers[name] = tokenizer.tokenize(value);
  }
}

export function sanitizeAppMap(
  appmap: AppMap,
  tokenizer: ValueTokenizer = new ValueTokenizer()
): AppMap {
  for (const event of appmap.events ?? []) {
    for (const p of event.parameters ?? []) sanitizeSlot(p, tokenizer);
    for (const m of event.message ?? []) sanitizeSlot(m, tokenizer);
    sanitizeSlot(event.receiver, tokenizer);
    sanitizeSlot(event.return_value, tokenizer);

    for (const x of event.exceptions ?? []) {
      if (typeof x.message === 'string') x.message = tokenizer.tokenize(x.message);
      if (typeof x.value === 'string') x.value = tokenizer.tokenize(x.value);
    }

    const serverRequest = event.http_server_request;
    if (serverRequest) {
      // The concrete path carries path params (ids, PII); the normalized
      // route template is the interesting part and stays.
      if (typeof serverRequest.path_info === 'string')
        serverRequest.path_info = tokenizer.tokenize(serverRequest.path_info);
      sanitizeHeaders(serverRequest.headers, tokenizer);
    }
    const clientRequest = event.http_client_request;
    if (clientRequest) {
      if (typeof clientRequest.url === 'string')
        clientRequest.url = tokenizer.tokenize(clientRequest.url);
      sanitizeHeaders(clientRequest.headers, tokenizer);
    }
    sanitizeHeaders(event.http_server_response?.headers, tokenizer);
    sanitizeHeaders(event.http_client_response?.headers, tokenizer);

    const sqlQuery = event.sql_query;
    if (sqlQuery && typeof sqlQuery.sql === 'string')
      sqlQuery.sql = sanitizeSql(sqlQuery.sql, sqlQuery.database_type, tokenizer);
  }
  return appmap;
}

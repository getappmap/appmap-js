import type { NumberFilter } from './parseFilter';

// Shared recording-scope filter shape — the subset of CLI filter flags that
// constrain *which recordings* a verb considers (as opposed to row-level
// filters like --duration or --label that constrain rows within a recording).
//
// Verb-specific filter types should extend this; helpers in this file accept
// any shape with the relevant fields.
export interface RecordingScope {
  branch?: string;
  commit?: string;
  since?: string;
  until?: string;
  appmap?: string;
  // HTTP-level filters that scope to "the recording must contain ≥1
  // matching server request":
  route?: string;          // "POST /orders" or "/orders"
  status?: NumberFilter;
}

export interface RouteSpec {
  method?: string;
  path: string;
}

const HTTP_METHODS = /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(.+)$/i;

export function parseRoute(s: string): RouteSpec {
  const m = s.match(HTTP_METHODS);
  if (m) return { method: m[1].toUpperCase(), path: m[2] };
  return { path: s };
}

// Returns SQL clauses (and params) that match an --appmap reference against
// the appmaps table, accepting any of:
//   - exact appmap.name
//   - source_path ending in `<sep><ref>.appmap.json`  (Unix or Windows sep)
//   - source_path ending in `<sep><ref>`              (non-`.appmap.json` stores)
// Used by find / tree / hotspots so the lookup behaves the same everywhere.
export function appmapRefClause(
  ref: string,
  alias: string
): { sql: string; params: string[] } {
  return {
    sql: `(${alias}.name = ?
        OR ${alias}.source_path GLOB '*[/\\\\]' || ? || '.appmap.json'
        OR ${alias}.source_path GLOB '*[/\\\\]' || ?)`,
    params: [ref, ref, ref],
  };
}

export interface Clauses {
  where: string[];
  params: (string | number)[];
}

// Recording-level filters that go on the appmaps row directly.
export function appmapWhere(filter: RecordingScope, alias: string): Clauses {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.branch) {
    where.push(`${alias}.git_branch = ?`);
    params.push(filter.branch);
  }
  if (filter.commit) {
    where.push(`${alias}.git_commit = ?`);
    params.push(filter.commit);
  }
  if (filter.since) {
    where.push(`${alias}.timestamp >= ?`);
    params.push(filter.since);
  }
  if (filter.until) {
    where.push(`${alias}.timestamp <= ?`);
    params.push(filter.until);
  }
  if (filter.appmap) {
    const ref = appmapRefClause(filter.appmap, alias);
    where.push(ref.sql);
    params.push(...ref.params);
  }
  return { where, params };
}

// HTTP-level filters that scope to "the recording must contain ≥1 matching
// server request." Used as a subquery for non-request finds. The alias
// defaults to `h`; override when emitting clauses inside a nested subquery
// where the outer alias is taken.
export function httpScopeClauses(filter: RecordingScope, alias = 'h'): Clauses {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filter.route) {
    const route = parseRoute(filter.route);
    where.push(`COALESCE(${alias}.normalized_path, ${alias}.path) = ?`);
    params.push(route.path);
    if (route.method) {
      where.push(`${alias}.method = ?`);
      params.push(route.method);
    }
  }
  if (filter.status) {
    where.push(`${alias}.status_code ${filter.status.op} ?`);
    params.push(filter.status.value);
  }
  return { where, params };
}

// Parse a --class flag value into (package, class, method) components, per
// V3's accepted forms:
//   short        : "UserRepository" / "Cls1::Cls2"
//   class+method : "UserRepository#findById" / "Cls1::Cls2#m"
//   pkg+class    : "app/services/UserRepository"
//   full fqid    : "app/services/UserRepository#findById"
//                  "app/Outer::Inner.parse"   (static method)
//
// Class chains use `::` as the inner separator (canonical V3, also Ruby /
// C++ idiomatic); we treat that as part of the class name, not a split
// point. The method separator (`#` or `.`) only applies when the input is
// in canonical form (contains `/`) or uses `#` explicitly. A short-form
// dot like "org.example.Foo" is kept whole — Java/Python dot-form class
// names match the defined_class fallback, not the normalized columns.
export interface ClassMethodParts {
  package?: string;
  class?: string;
  method?: string;
}

export function parseClassRef(input: string): ClassMethodParts {
  const slashIdx = input.lastIndexOf('/');

  if (slashIdx < 0) {
    // Short form. `#` is the only unambiguous method separator here; `.`
    // is left in place because it could be part of a Java/Python class name
    // ("org.example.Foo") rather than a method separator.
    const hashIdx = input.lastIndexOf('#');
    if (hashIdx > 0) {
      return {
        class: input.slice(0, hashIdx) || undefined,
        method: input.slice(hashIdx + 1),
      };
    }
    return { class: input.length > 0 ? input : undefined };
  }

  // Canonical fqid (slash present). The method separator is the rightmost
  // `#` or `.` AFTER the last `/`. (Inner `.` characters in the package
  // path don't apply — packages are slash-separated.)
  let methodSepIdx = -1;
  for (let i = input.length - 1; i > slashIdx; i--) {
    const ch = input[i];
    if (ch === '#' || ch === '.') {
      methodSepIdx = i;
      break;
    }
  }

  let classPart = input;
  let methodPart: string | undefined;
  if (methodSepIdx > 0) {
    classPart = input.slice(0, methodSepIdx);
    methodPart = input.slice(methodSepIdx + 1);
  }

  const classSlashIdx = classPart.lastIndexOf('/');
  const pkg = classPart.slice(0, classSlashIdx);
  const cls = classPart.slice(classSlashIdx + 1);
  return {
    package: pkg.length > 0 ? pkg : undefined,
    class: cls.length > 0 ? cls : undefined,
    method: methodPart,
  };
}

// Match a --class input against function_calls via the normalized
// code_objects columns. The `class` part of the user input is interpreted
// as either:
//   - A `::`-separated chain ("Outer::Inner") → match `classes` exactly
//     (canonical JSON form).
//   - A single-segment short form ("Cipher")  → match `leaf_class`
//     exactly (hits any chain ending in that class — top-level Cipher
//     and OpenSSL::Cipher both qualify).
// Adding a package narrows further: `... AND package = ?`.
//
// Falls back to function_calls.defined_class for rows that aren't linked
// to a code_object (sparse classMap recordings). The fallback recognizes
// `.` (Java/Python), `::` (Ruby/C++) as suffix separators for short-form
// matching against the raw event field.
export function classFilterClauses(input: string, fcAlias: string): Clauses {
  const parts = parseClassRef(input);
  if (!parts.class) {
    return { where: ['1 = 0'], params: [] };
  }

  const coWhere: string[] = [];
  const coParams: (string | number)[] = [];
  if (parts.class.includes('::')) {
    // Full chain — match classes JSON exactly.
    coWhere.push('classes = ?');
    coParams.push(JSON.stringify(parts.class.split('::')));
  } else {
    // Single segment — match the leaf.
    coWhere.push('leaf_class = ?');
    coParams.push(parts.class);
  }
  if (parts.package) {
    coWhere.push('package = ?');
    coParams.push(parts.package);
  }
  if (parts.method) {
    coWhere.push('method = ?');
    coParams.push(parts.method);
  }

  // Fallback for unlinked function_calls.
  const fbWhere: string[] = [
    `${fcAlias}.defined_class = ?`,
    `${fcAlias}.defined_class LIKE '%.' || ?`,
    `${fcAlias}.defined_class LIKE '%::' || ?`,
  ];
  const fbParams: (string | number)[] = [parts.class, parts.class, parts.class];

  return {
    where: [
      `(${fcAlias}.code_object_id IN (
          SELECT id FROM code_objects WHERE ${coWhere.join(' AND ')}
        )
        OR (${fcAlias}.code_object_id IS NULL AND (${fbWhere.join(' OR ')})))`,
    ],
    params: [...coParams, ...fbParams],
  };
}

// Match a --method input against function_calls via the normalized
// code_objects.method column, with a fallback to function_calls.method_id
// for rows that aren't linked to a code_object.
export function methodFilterClauses(input: string, fcAlias: string): Clauses {
  return {
    where: [
      `(${fcAlias}.code_object_id IN (
          SELECT id FROM code_objects WHERE method = ?
        )
        OR (${fcAlias}.code_object_id IS NULL AND ${fcAlias}.method_id = ?))`,
    ],
    params: [input, input],
  };
}

// Build "<row>.appmap_id IN (SELECT a.id …)" for tables where filtering at
// the appmap-id level is the right shape (sql_queries, function_calls,
// exceptions, http_client_requests). Returns null if no recording-level
// filtering is needed.
export function appmapIdScope(
  filter: RecordingScope,
  rowAlias: string
): { sql: string; params: (string | number)[] } | null {
  const a = appmapWhere(filter, 'a');
  const h = httpScopeClauses(filter);
  if (a.where.length === 0 && h.where.length === 0) return null;

  if (h.where.length > 0) {
    const all = [...a.where, ...h.where].join(' AND ');
    return {
      sql: `${rowAlias}.appmap_id IN (
        SELECT DISTINCT a.id FROM appmaps a
        JOIN http_requests h ON h.appmap_id = a.id
        WHERE ${all}
      )`,
      params: [...a.params, ...h.params],
    };
  }
  return {
    sql: `${rowAlias}.appmap_id IN (
      SELECT a.id FROM appmaps a WHERE ${a.where.join(' AND ')}
    )`,
    params: a.params,
  };
}

// Shared parsers for CLI filter flags.
//
// These convert user-typed strings into canonical structured forms that
// query functions can apply uniformly. Verbs share these so a flag like
// --since "7d ago" means the same thing everywhere.

export type Comparator = '=' | '>=' | '<=' | '>' | '<';

export interface NumberFilter {
  op: Comparator;
  value: number;
}

// Parse a status filter: "500", "=500", ">=500", ">500", "<400", "<=399".
// Whitespace around the operator is tolerated.
export function parseStatus(input: string): NumberFilter {
  const m = input.trim().match(/^(>=|<=|>|<|=)?\s*(\d+)$/);
  if (!m) throw new Error(`invalid --status filter: ${input}`);
  const op = (m[1] ?? '=') as Comparator;
  return { op, value: Number.parseInt(m[2], 10) };
}

// Parse a duration filter: ">1s", ">=500ms", "<2m". The numeric form is
// returned in milliseconds for direct comparison against elapsed_ms.
export function parseDuration(input: string): NumberFilter {
  const m = input.trim().match(/^(>=|<=|>|<|=)?\s*(\d+(?:\.\d+)?)\s*(ms|s|m|h)?$/);
  if (!m) throw new Error(`invalid --duration filter: ${input}`);
  const op = (m[1] ?? '=') as Comparator;
  const n = Number.parseFloat(m[2]);
  const unit = m[3] ?? 'ms';
  const ms =
    unit === 'ms'
      ? n
      : unit === 's'
      ? n * 1000
      : unit === 'm'
      ? n * 60_000
      : n * 3_600_000;
  return { op, value: ms };
}

// Parse a time spec: ISO date/timestamp ("2026-04-29", "2026-04-29T14:21:08Z")
// or a relative offset ("7d ago", "30m ago", "2h ago", "45s ago"). Returns
// an ISO 8601 string suitable for direct text comparison against the
// timestamp column (which is also ISO 8601).
export function parseTime(input: string, now: Date = new Date()): string {
  const trimmed = input.trim();

  const rel = trimmed.match(/^(\d+)\s*([smhd])\s+ago$/);
  if (rel) {
    const n = Number.parseInt(rel[1], 10);
    const unit = rel[2];
    const ms =
      unit === 's'
        ? n * 1_000
        : unit === 'm'
        ? n * 60_000
        : unit === 'h'
        ? n * 3_600_000
        : n * 86_400_000;
    return new Date(now.getTime() - ms).toISOString();
  }

  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) throw new Error(`invalid time filter: ${input}`);
  return new Date(ms).toISOString();
}

// Apply a NumberFilter as a WHERE-clause fragment. Returns the SQL fragment
// (with a `?` placeholder) and the value to bind. Throws on unknown op.
export function numberFilterSql(
  column: string,
  filter: NumberFilter
): { sql: string; value: number } {
  return { sql: `${column} ${filter.op} ?`, value: filter.value };
}

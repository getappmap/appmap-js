// Render a row of cells as a tab-aligned line. Per V3, tabular output never
// wraps — long fqids extend past terminal width rather than break (so grep
// over output stays usable). Pipe through `less -S` or use --json instead.
//
// `widths` is a per-column minimum width; cells longer than the minimum
// extend the column.
export function formatTable(
  headers: readonly string[],
  rows: readonly (readonly string[])[]
): string {
  const widths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length))
  );
  const lines: string[] = [];
  lines.push(headers.map((h, i) => h.padEnd(widths[i])).join('  '));
  for (const row of rows) {
    lines.push(row.map((c, i) => (c ?? '').padEnd(widths[i])).join('  '));
  }
  return lines.join('\n');
}

// Format a duration in ms as "12ms" / "480ms" / "3.4s" / "1.2s".
export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Format a non-negative integer with thousands separators ("1,891").
export function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}

// Format a percentage like "4.6%".
export function formatPct(pct: number): string {
  return `${pct.toFixed(1)}%`;
}

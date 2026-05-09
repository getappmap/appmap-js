// Display helpers shared across pages.

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '-';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms.toFixed(1)}ms`;
}

export function formatPct(p: number | null | undefined): string {
  if (p == null) return '-';
  return `${p.toFixed(1)}%`;
}

export function formatTime(ts: string | null | undefined): string {
  if (!ts) return '-';
  return new Date(ts).toLocaleString();
}

// Threshold-banded color for elapsed-time values.
export function severityColor(ms: number | null | undefined): string {
  if (ms == null) return 'text-gray-400';
  if (ms < 10) return 'text-green-400';
  if (ms < 100) return 'text-yellow-400';
  if (ms < 1000) return 'text-orange-400';
  return 'text-red-400';
}

// HTTP status code → text color.
export function statusColor(code: number): string {
  if (code >= 500) return 'text-red-400';
  if (code >= 400) return 'text-yellow-400';
  return 'text-green-400';
}

// HTTP method badge colors.
export function methodBadge(method: string): string {
  const colors: Record<string, string> = {
    GET: 'bg-green-900/50 text-green-400',
    POST: 'bg-blue-900/50 text-blue-400',
    PUT: 'bg-yellow-900/50 text-yellow-400',
    DELETE: 'bg-red-900/50 text-red-400',
    PATCH: 'bg-purple-900/50 text-purple-400',
  };
  return colors[method] ?? 'bg-gray-800 text-gray-400';
}

// Heat-bar fill color by ratio (0-1).
export function heatColor(ratio: number): string {
  if (ratio < 0.25) return 'bg-green-500';
  if (ratio < 0.5) return 'bg-yellow-500';
  if (ratio < 0.75) return 'bg-orange-500';
  return 'bg-red-500';
}

// URL-safe encoding for an appmap path used as a query parameter.
// Filesystem paths almost never contain characters that need escaping,
// but we encode anyway so the URL is well-formed regardless.
export function encodeAppmap(path: string): string {
  return encodeURIComponent(path);
}

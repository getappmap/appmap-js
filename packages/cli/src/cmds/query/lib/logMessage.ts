// Pick a displayable message from a log row's captured fields.
//   1. If return_value parses as JSON with a `message` field, use it
//      (this is the structured-return contract).
//   2. Otherwise, look in parameters_json for a parameter whose `name`
//      is `message` or `msg`; fall back to the first string-typed value.
//   3. Otherwise, return ''.
// Display-only — does not affect filtering. The `--message` SQL LIKE
// runs against the raw columns and may return rows whose projected
// message doesn't contain the substring (e.g., matched a class name);
// that's the documented FP-tolerant behavior.
export function projectLogMessage(
  parametersJson: string | null,
  returnValue: string | null
): string {
  if (returnValue) {
    try {
      const parsed = JSON.parse(returnValue) as Record<string, unknown>;
      if (parsed && typeof parsed === 'object' && typeof parsed.message === 'string') {
        return parsed.message;
      }
    } catch {
      // not structured — fall through
    }
  }
  if (parametersJson) {
    try {
      const params = JSON.parse(parametersJson) as { name?: string; class?: string; value?: unknown }[];
      const named = params.find((p) => p.name === 'message' || p.name === 'msg');
      if (named?.value != null) return stripWrappingQuotes(String(named.value));
      const firstString = params.find((p) => typeof p.value === 'string');
      if (firstString) return stripWrappingQuotes(String(firstString.value));
      if (params.length > 0) return JSON.stringify(params.map((p) => p.value));
    } catch {
      return parametersJson;
    }
  }
  // No structured message available. Return blank rather than the raw
  // `return_value` (which is often noise like "true" / "None").
  return '';
}

// Some recorders stringify String parameter values with the source-code
// quote characters preserved (e.g. `'hello'`). Strip a single matched
// pair of leading+trailing single or double quotes so the display text
// is the raw message.
function stripWrappingQuotes(s: string): string {
  if (s.length >= 2) {
    const first = s[0];
    const last = s[s.length - 1];
    if ((first === "'" || first === '"') && first === last) return s.slice(1, -1);
  }
  return s;
}

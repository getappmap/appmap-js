// Diagnostic helper for find_calls when matches = 0.
//
// The cost of an empty result isn't free — every retried call costs
// cache-creation tokens for the request setup AND for adding the
// (unhelpful) result to the conversation. Empty find_calls calls were
// observed to make up ~30% of one fixture's tool usage, with the agent
// guessing different identifier shapes (interface vs impl, missing `#`,
// dot vs slash, trailing parens). This helper suggests up to 5 similar
// function ids and explains the most likely cause so the next call lands.
//
// Only invoked when matches = 0 — the cost of scanning the function-id
// index is paid only on miss. Scoring is a substring match boosted by
// component overlap (leaf_class / method) plus a Levenshtein tiebreak;
// no fancy ML, just enough to catch the common typos.

import sqlite3 from 'better-sqlite3';

import { parseClassRef } from './scope';

export interface DidYouMean {
  function_id: string;
  calls: number;
  // Set false when the function id appears in the classMap but never
  // fired in any recording — distinguishes "wrong name" from
  // "function not invoked in this trace."
  in_index?: false;
}

export interface FindCallsDiagnostic {
  did_you_mean: DidYouMean[];
  hint: string;
}

const MAX_SUGGESTIONS = 5;
// Levenshtein-only matches barely above zero produce noise (any short
// fqid will match any short probe a little). Require some structural
// signal — a leaf_class or method overlap, or a high Levenshtein
// similarity — before we hand the agent a "did you mean."
const MIN_SCORE = 30;

interface CodeObjectRow {
  fqid: string;
  leaf_class: string;
  method: string;
  calls: number;
}

export function suggestSimilarFunctionIds(
  db: sqlite3.Database,
  className: string | undefined,
  methodId: string | undefined
): FindCallsDiagnostic {
  // Probe = canonical "Class#method" reconstruction of what the agent
  // asked for. We use it as the input to Levenshtein-style scoring.
  const probe = composeProbe(className, methodId);

  // Parse the class reference once — exposes the parts we use for both
  // structural hints (interface-vs-impl, missing separator) and for
  // boosting suggestions where leaf_class / method match.
  const parts = className ? parseClassRef(className) : {};
  const probeClass = parts.class ?? className;
  // parseClassRef.method only fires for canonical fqid forms or `#`-form.
  // Otherwise the explicit methodId argument carries the method.
  const probeMethod = methodId ?? parts.method;

  const rows = db
    .prepare(
      `SELECT co.fqid                                 AS fqid,
              co.leaf_class                           AS leaf_class,
              co.method                               AS method,
              COUNT(fc.id)                            AS calls
       FROM code_objects co
       LEFT JOIN function_calls fc ON fc.code_object_id = co.id
       GROUP BY co.id`
    )
    .all() as CodeObjectRow[];

  const scored = rows
    .map((r) => ({
      row: r,
      score: scoreCandidate(r, probe, probeClass, probeMethod),
    }))
    .filter((s) => s.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);

  const did_you_mean: DidYouMean[] = scored.map((s) => {
    const entry: DidYouMean = { function_id: s.row.fqid, calls: s.row.calls };
    if (s.row.calls === 0) entry.in_index = false;
    return entry;
  });

  return {
    did_you_mean,
    hint: buildHint(probe, did_you_mean, scored.map((s) => s.row), probeClass, probeMethod),
  };
}

function composeProbe(
  className: string | undefined,
  methodId: string | undefined
): string {
  if (className && methodId) {
    // Avoid double-separators if the className already embeds a #.
    return /[#.]/.test(className) ? className : `${className}#${methodId}`;
  }
  return className ?? methodId ?? '';
}

// Score a candidate higher when it shares structural fragments with
// the probe (leaf_class substring, method exact) before falling back
// to Levenshtein similarity. Pure scoring; no side effects.
function scoreCandidate(
  row: CodeObjectRow,
  probe: string,
  probeClass: string | undefined,
  probeMethod: string | undefined
): number {
  let score = 0;

  if (probeMethod && row.method === probeMethod) score += 60;
  else if (probeMethod && row.method.toLowerCase() === probeMethod.toLowerCase()) score += 40;

  if (probeClass) {
    const lc = row.leaf_class.toLowerCase();
    const pc = probeClass.toLowerCase();
    if (lc === pc) score += 50;
    else if (lc.includes(pc) || pc.includes(lc)) score += 30;
  }

  // Levenshtein-based component, capped so close-but-not-identical
  // candidates don't overpower an exact-component match.
  const dist = levenshtein(row.fqid.toLowerCase(), probe.toLowerCase());
  const maxLen = Math.max(row.fqid.length, probe.length);
  const lev = maxLen === 0 ? 0 : Math.max(0, 25 - Math.round((dist * 25) / maxLen));
  score += lev;

  return score;
}

// Detect common identifier-shape mistakes. A short hint is much cheaper
// than another empty find_calls retry, so be specific when we can.
function buildHint(
  probe: string,
  suggestions: DidYouMean[],
  topRows: CodeObjectRow[],
  probeClass: string | undefined,
  probeMethod: string | undefined
): string {
  if (suggestions.length === 0) {
    return (
      `No functions matching '${probe}' fired in any recording. ` +
      `Possible reasons: function not invoked in this trace; ` +
      `class not in package coverage scope (check appmap.yml); typo in identifier.`
    );
  }

  const top = suggestions[0];
  const topRow = topRows[0];

  // Interface vs Impl: top suggestion's leaf_class is the probe's class
  // plus an "Impl" / "Default" / "Base" suffix (or the probe's class is
  // a prefix of the top's leaf class).
  if (probeClass && topRow.leaf_class !== probeClass) {
    const lc = topRow.leaf_class;
    const pc = probeClass;
    if (
      lc.length > pc.length &&
      lc.toLowerCase().startsWith(pc.toLowerCase()) &&
      /^(Impl|Default|Base|Spring|Mock)/i.test(lc.slice(pc.length))
    ) {
      return (
        `Closest match: '${top.function_id}' (${top.calls} call${top.calls === 1 ? '' : 's'}). ` +
        `'${probeClass}' looks like an interface; the runtime invokes '${lc}'.`
      );
    }
  }

  // FQCN with `.` instead of `/` — the canonical separator in the index
  // is `/` between package segments.
  if (probeClass && probeClass.includes('.') && !probeClass.includes('/')) {
    return (
      `Closest match: '${top.function_id}'. ` +
      `Use slash-separated packages: 'app/services/Foo', not 'app.services.Foo'.`
    );
  }

  // Trailing parens.
  if (probeMethod && /\(\)?\s*$/.test(probeMethod)) {
    return (
      `Closest match: '${top.function_id}'. ` +
      `Don't include parentheses; use 'Class#method' (no '()').`
    );
  }

  // Missing # / . between class and method (probe has neither, but the
  // top suggestion uses one).
  if (probe && !/[#.]/.test(probe) && /[#.]/.test(top.function_id)) {
    return (
      `Closest match: '${top.function_id}'. ` +
      `Use 'Class#method' for instance methods, 'Class.method' for static methods.`
    );
  }

  return `Closest match: '${top.function_id}' (${top.calls} call${top.calls === 1 ? '' : 's'}).`;
}

// Plain DP Levenshtein. Strings here are short (<100 chars); a custom
// implementation avoids pulling another dependency for ~30 lines of code.
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = new Array<number>(b.length + 1);
  let curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

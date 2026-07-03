// Value-aware truncation of captured AppMap value strings (parameters, return
// values, receivers, log messages). Shared by the dense MCP tree renderer
// (cmds/query/lib/treeRender) and the `appmap trim` command.
//
// A flat prefix cut wastes the budget on identity fields — a record like
// `ApprovalRequest[requestId=<uuid>, loanId=<uuid>, status=APPROVED, …]` spends
// ~80 chars on two UUIDs before reaching the state field that actually
// distinguishes the value. truncateStructValue parses the struct shape and
// budgets *per field value*, clipping id/hash-shaped values hard so semantic
// fields downstream survive.

export function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…';
}

export interface StructBudget {
  perValueCap: number; // max chars for an ordinary field value
  idCap: number; // max chars for a uuid/hash-shaped value (identity, low signal)
  maxFields: number; // fields rendered before the tail is elided
  flatCap: number; // flat cap applied to non-struct strings
}

export const MCP_RETURN_VALUE_BUDGET: StructBudget = {
  perValueCap: 48,
  idCap: 12,
  maxFields: 16,
  flatCap: 120,
};

// A uuid, a hex object hash (`@1a2b3c4`, `0x00007f…`), or either prefixed
// by a short tag (`LOAN-<uuid>`, `PID-<uuid>`). These are identity, not
// state — low root-cause signal — so they get the tight idCap.
const ID_VALUE_RE =
  /(?:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|(?:@|0x)[0-9a-f]{4,})/i;

const CLOSE_FOR: Record<string, string> = { '[': ']', '{': '}', '(': ')' };

interface Struct {
  prefix: string; // leading type name (may be empty for a bare collection)
  open: string; // opening delimiter
  body: string; // comma-separated field list
  close: string; // closing delimiter
}

// Recognize the toString()/repr shapes AppMap captures across the four
// supported languages:
//   Java record / Python repr   Type[…]  /  Type(…)
//   Java bean / JS-ish object   Type{…}  /  {…}
//   Ruby                        #<Type …>
// Returns null for primitives, `[object Object]`-style opaque values, and
// `Type@1a2b3c` hashes — those fall back to a flat truncation.
function parseStruct(s: string): Struct | null {
  // `[\s\S]` (not `.`) so a multi-line body matches — e.g. Node util.inspect
  // output, `ClassName {\n  a: 1,\n  ...\n}`. The optional `\s*` after the type
  // name matches the space in that same `ClassName { ... }` form.
  const ruby = /^#<([^\s>]+)\s+([\s\S]+)>$/.exec(s);
  if (ruby) return { prefix: `#<${ruby[1]} `, open: '', body: ruby[2], close: '>' };
  const m = /^([A-Za-z_][\w.$]*\s*)?([[{(])([\s\S]*)([\]})])$/.exec(s);
  if (m && CLOSE_FOR[m[2]] === m[4]) {
    return { prefix: m[1] ?? '', open: m[2], body: m[3], close: m[4] };
  }
  return null;
}

// Split a struct body on top-level ", ". Commas nested inside [], {}, (),
// or <> belong to a field's own value and must not split it.
function splitTopLevelFields(body: string): string[] {
  if (body.trim().length === 0) return [];
  const out: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === '[' || c === '{' || c === '(' || c === '<') depth++;
    else if (c === ']' || c === '}' || c === ')' || c === '>') depth = Math.max(0, depth - 1);
    else if (c === ',' && depth === 0 && body[i + 1] === ' ') {
      out.push(body.slice(start, i));
      start = i + 2;
      i++;
    }
  }
  out.push(body.slice(start));
  return out;
}

// A field value that is itself a struct (a nested record, or an element
// of a collection-of-records like `getParticipants`) recurses so its own
// fields get the per-field budget too — flat-clipping it would collapse
// `[ParticipantState[…status=PENDING], …]` down to an opaque stub. Depth
// is bounded so a pathologically deep value can't recurse without end.
const MAX_STRUCT_DEPTH = 4;

// Truncate one field value: recurse if it is itself a struct, else
// id/hash-shaped values get the tight idCap and all others the perValueCap.
function truncateFieldValue(value: string, budget: StructBudget, depth: number): string {
  if (depth < MAX_STRUCT_DEPTH) {
    const nested = parseStruct(value);
    if (nested) return renderStruct(nested, budget, depth + 1);
  }
  const cap = ID_VALUE_RE.test(value) ? budget.idCap : budget.perValueCap;
  return truncate(value, cap);
}

// Truncate one `name=value` / `name: value` field, keeping the name whole
// and budgeting only the value. A field with no recognizable name
// separator (a bare collection element) is budgeted as a whole value.
function truncateField(field: string, budget: StructBudget, depth: number): string {
  const m = /^(\s*[\w$]+\s*)([:=])(\s*)([\s\S]*)$/.exec(field);
  if (!m) return truncateFieldValue(field, budget, depth);
  return `${m[1]}${m[2]}${m[3]}${truncateFieldValue(m[4], budget, depth)}`;
}

function renderStruct(st: Struct, budget: StructBudget, depth: number): string {
  const fields = splitTopLevelFields(st.body);
  const kept = fields.slice(0, budget.maxFields).map((f) => truncateField(f, budget, depth));
  const elided = fields.length - kept.length;
  const tail = elided > 0 ? `${kept.length > 0 ? ', ' : ''}…+${elided} more` : '';
  return `${st.prefix}${st.open}${kept.join(', ')}${tail}${st.close}`;
}

// Value-aware truncation for a captured return value / parameter. Parses
// the struct shape and budgets per field value, recursing into nested
// structs; non-struct strings fall back to a flat cap. See StructBudget.
export function truncateStructValue(
  s: string,
  budget: StructBudget = MCP_RETURN_VALUE_BUDGET
): string {
  const st = parseStruct(s);
  if (!st) return truncate(s, budget.flatCap);
  return renderStruct(st, budget, 1);
}

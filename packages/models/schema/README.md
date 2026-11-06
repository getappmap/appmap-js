# AppMap comparison contract

`comparison.schema.json` defines a view-neutral envelope. **Sequence v1 is the
only implemented payload contract here.** `dependency`, `trace` and `flame` are
reserved opaque view slots, not three more implemented or interoperable views.

## Checking a bundle

1. Apply the exported JSON Schema (draft 2020-12) to parsed JSON for structural
   checks: required fields, supported sequence version **1**, serialized actor and
   recursive action shapes, nonempty references, change kinds and required sides.
2. Run `validateAppMapComparison` (or `assertAppMapComparison`) for mandatory
   semantic checks as well: unique change IDs, capability/payload correspondence,
   declared actor references, diagram-local unique element IDs and reference
   resolution. Schema success alone does **not** establish these relationships.

Runtime implements these structural checks as well as the semantic checks; the
schema cannot express cross-object referential integrity. Neither checker proves
that a change classification is truthful, a viewer interoperates, or recordings
correspond to the supplied diagrams. Reserved views receive envelope checks only.
A producer must run both checks before publishing a portable bundle.

Additive fields, recording metadata, navigation metadata and extensions are
preserved; validation never rewrites the input. Unsupported top-level or sequence
versions must be rejected. Each future implemented view needs its own versioned
payload semantics, conformance corpus and receiver evidence.

## Serialized sequence v1

Each diagram contains `actors` and `rootActions`. Actor IDs are unique per diagram;
actions reference them with string `caller`/`callee` IDs, **not** in-memory actor
objects. Every action has `nodeType`, `digest`, `subtreeDigest`, `children` and
`eventIds`. Supported action types are loop **1**, function **3**, server RPC **4**,
client RPC **5**, and query **6**. Conditional **2** exists in the sequence enum but
is not an implemented action. Loops require positive safe-integer `count`;
functions require `name`, `callee` and scalar `stableProperties`; RPCs require
`route` and `callee`; queries require `query` and `callee`.

Current serialization can omit `caller` even for top-level query/client RPC,
`static` for functions and `status` for RPCs. These fields are optional, but checked
when present. All known action properties retain their schema-defined shapes
on **every** node type, even when that node type does not require them (for
example, a function may carry positive `count`, but never `count: 0`). Unknown
additive properties remain allowed and are not interpreted as known properties.
Stable properties include booleans (e.g. `raises_exception`), despite
the narrower historic in-memory declaration. Return types, labels, elapsed time,
former names/results, move provenance and diff modes 1–4 remain supported.
Runtime bounds each diagram at 100,000 actions and depth 256 (root depth zero),
and rejects child cycles. These defensive semantic limits are not schema keywords.

### Navigation

An action may have an optional nonempty `elementId`. It is unique **within one
diagram**. Base/head namespaces are separate; the diff diagram must assign its own
unique IDs even when it contains actions from both recordings. Each supplied
`elementIds` entry must resolve to exactly one action on the reference's declared
base/head/diff side. Top-level change base/head references are checked against the
sequence sides when the change includes a sequence view reference.

Event IDs remain authentic recording IDs and may repeat across actions, especially
in a merged diff. An event-only reference is accepted only when each event ID
identifies exactly one action; otherwise supply element IDs. When element IDs are
present they are the target authority, and accompanying event IDs are contextual,
not a claim of uniqueness. This does not assert viewer navigation support.

## Canonical change identity

`canonicalComparisonIdentity` accepts only finite acyclic plain JSON: primitives,
dense arrays and objects with `Object.prototype` or null prototype and enumerable
own string-keyed data properties. Dates, other class instances, symbols, accessors,
undefined, sparse/extended arrays, non-finite numbers and cycles are rejected with
`TypeError`, not coerced or omitted. Shared acyclic subobjects are allowed.
Object keys sort lexicographically; array order matters; numbers use JSON encoding
(including JSON's normalization of negative zero). Root depth is zero, maximum
depth is **64**, and at most **10,000 value nodes** are visited. Exported constants
name these limits. This is this contract's encoding, not a claim of RFC 8785 JCS.

`makeComparisonChangeId` hashes that encoding. Producers must choose a semantic
identity that excludes incidental event numbers/positions to obtain stability
under renumbering or unrelated insertion. The helper alone cannot establish that
property. Repeated indistinguishable identities use zero-based `occurrence`, with
suffix `_2`, `_3`, etc.; inserting an identical earlier occurrence can renumber
later indistinguishable occurrences. Both occurrence and occurrence+1 must be safe
integers. IDs are opaque, not an ordering or classification authority.

## CLI producer prototype — unreleased semantic correction

The `sequence-diagram-compare` producer is a **sequence-only first vertical
slice**, not a viewer/UI readiness or frozen consumer-adoption claim. The v1
schema now also checks sequence actions, actors and return values structurally
(see CHANGELOG.md); this prototype corrects the producer's semantic
classification, without a release version or dependency-pin change.

Behavior is aligned on independently built **uncompressed** base/head diagrams,
with the same expansion/filter options as the display. Comparison-private
node/subtree keys include supported node kind, actor-qualified identity, the
upstream stable digest, serialized return metadata, and meaningful call/RPC
properties. Labels and timing are not behavioral identity. Ordinary SQL retains
upstream literal normalization: different literal values alone do not make a
query change. Only the constant `truncatedQuery` digest uses raw SQL text as a
fallback, so truncated SELECT and DELETE remain distinguishable.

Base/head **display** diagrams independently honor `--loops` (default `true`)
and retain ordinary sequence digests. Canonical kinds, IDs and alignment do not
depend on that display option. The **diff overlay is always expanded**, using
the semantic pair, so each actual changed/added/removed call has its own target.
Grouping-derived loops are presentation, not recorded control-flow events:
one extra repeated call is one added call, not `control-flow-changed`. The schema's
control-flow change kinds and structural/eventless targets remain available to
other producers; this producer does not classify grouping as true control flow.
Dependency, trace and flame payloads remain reserved, not implemented views.

For every top-level base/head reference, sequence-view reference, and location
parent target, this producer projects authentic semantic call event IDs into a
**separate display index per side**. Each event must belong to exactly one
display action; missing/ambiguous membership or an existing target with the
wrong event membership is refused. Multiple changes can share one grouped
display target, but each reference retains **only its own source event subset**,
never the entire group's events. Diff targets use private semantic origins and
independent real overlay IDs, not overlapping recording event IDs.

`details.location` deliberately mixes two coordinate roles: `ancestors` and
`index` describe the uncompressed semantic source location, while
`parentElementId` navigates to the actual display representative of that semantic
parent (not necessarily an immediate synthetic loop wrapper). These navigation
IDs are not canonical change identity. This stronger event-membership guarantee
is producer-local; the generic v1 validator still treats event IDs accompanying
element IDs as contextual and does not enforce this producer's membership rule.

Earlier producer tests that expected five edits for a grouped return change,
four edits for truncated SQL, or a control-flow change for a repetition increase
were layout-artifact oracles. Executable Gherkin now asserts exact behavioral
changes and stable IDs across omitted/true/false grouping, preserves checks for
real grouped views/counts, and requires expanded overlays and authentic targets.
Existing structural conformance/consumer fixtures are not semantic truth oracles.

## Distribution and fixtures

Runtime helpers and payload types are exported from `@appland/models`; the pack
contains `types/public.d.ts` and `schema/comparison.schema.json` alongside CJS/ESM
builds. `examples/` supplies clean, added, removed, changed and reordered structural
fixtures. Non-clean fixtures contain actual serialized action targets. They show
contract shape, not an oracle for the producer's classification algorithm.
The JSON `kind`, not a filename suffix, identifies the envelope.

`conformance/manifest.json` lists portable JSON cases with separate expected
`structural` (JSON Schema) and `semantic` (mandatory runtime) outcomes. Models
tests execute the runtime column; the CLI's existing AJV 8 dependency can execute
the schema column without adding an AJV dependency to models. Structural-true /
semantic-false cases deliberately demonstrate relationships the schema cannot
express. Non-JSON identity failures and cycles are exercised in runtime tests,
not encoded as invalid JSON fixtures.

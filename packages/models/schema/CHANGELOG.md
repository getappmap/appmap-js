# AppMap comparison schema changelog

## Unreleased — CLI producer semantic correction (prototype)

Compared with the earlier public draft of this schema, v1 now checks sequence
actions, actors and return values structurally, fixes the sequence capability
version to 1 and bounds event IDs to safe integers. No release version or
dependency pin changes.
The sequence-only CLI producer now aligns uncompressed comparison-private
semantics independently of requested loop-grouped base/head displays. Its overlay
stays expanded; return-aware alignment avoids compensating change/addition
artifacts, ordinary SQL literal normalization remains upstream-defined, and only
`truncatedQuery` uses raw SQL text as a semantic fallback. Canonical repetition
increases are added calls, not derived-loop control-flow changes.

Producer navigation projects authentic event subsets and location-parent targets
into side-local display IDs, refusing missing/ambiguous/wrong membership. Source
location ancestry/index remain uncompressed coordinates. This is stronger than,
and does not tighten, generic v1 contextual event-reference checks. Earlier
layout-based producer assertions are explicitly superseded by behavioral
Given/When/Then oracles while grouped-view/count checks remain. Other view and
true-control-flow production remain unimplemented; no UI or frozen-adoption
claim is made. See the README's producer section for the coordinate contract.

## Version 1 — 2026-08-19

The first frozen comparison envelope establishes:

- `kind: appmap.comparison`;
- independent top-level and per-view schema versions;
- the reserved `dependency`, `sequence`, `trace`, and `flame` view identifiers;
- canonical `BehavioralChange` objects shared by every view;
- deterministic, opaque `chg_<hash>` change IDs;
- base/head recording and revision metadata;
- capability negotiation for views and navigation;
- Sequence Diagram view schema version 1;
- conformance fixtures for clean, added, removed, changed, and reordered behavior.

Additive fields remain backwards compatible. Any breaking envelope change requires
`schemaVersion: 2`; a breaking payload change increments only the affected view's
`schemaVersion`.
# AppMap comparison schema changelog

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
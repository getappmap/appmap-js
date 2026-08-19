# AppMap comparison contract

`comparison.schema.json` is the versioned, view-neutral envelope used to move a
before/after behavioral comparison between CI, editors, web applications, and MCP
hosts.

## Compatibility rules

- `kind` is always `appmap.comparison`.
- `schemaVersion` changes only when an existing consumer can no longer safely read
  the envelope.
- Each view has its own `schemaVersion`; a breaking Sequence Diagram payload change
  does not force a Dependency Map or Trace View payload change.
- Additive fields are permitted. Consumers must ignore fields they do not understand.
- Unsupported views may be ignored, but an unsupported top-level `schemaVersion`
  must be rejected.
- Behavioral change IDs are opaque and deterministic. Consumers must never infer
  ordering or meaning from the hash itself.
- A producer must validate the complete bundle before writing it.

## Canonical change identity

`makeComparisonChangeId` hashes canonical JSON with sorted object keys. A view
producer supplies semantic identity, such as the action kind, stable action digest,
actors, and ancestor path. Repeated indistinguishable changes use the occurrence
suffix (`_2`, `_3`, and so on).

This keeps IDs stable when an unrelated earlier change is inserted, unlike positional
IDs such as `change-0004`.

## Views

Version 1 reserves four views:

- `dependency`
- `sequence`
- `trace`
- `flame`

The first implementation supplies `views.sequence`. The envelope and shared
`BehavioralChange` objects are deliberately ready for the other three views.

## File names

The JSON `kind` is authoritative, not the filename. The current CLI retains
`*.compare.diff.sequence.json` while existing editor selectors are migrated. A future
`.appmap.compare.json` name can use the same version-1 contract.

## Examples

`examples/` contains valid contract fixtures for clean, added, removed, changed, and
reordered behavior. They are intended for consumers in other repositories and
languages to use as conformance fixtures.

# query-commands cleanup TODOS

## Quality of implementation

- Type safety – the code uses `as` casts without checking, `any` types abound. For ease of maintenance it should be improved with type
  safety in mind, using 'parse not validate' paradigm where appropriate.
- MCP error handling – problems with tool calls in particular almost always return misleading -32600 'invalid request' errors where other errors would be more appropriate.
- The changes introduced many lint errors. Many of them are related to type safety issues mentioned above. Some are caused by not using prettier. These should all be addressed. CLI code is already not lint-free, let's not add to this issue.

## Schema / DB

- `exceptions.event_id` should be `NOT NULL` — both import paths always write a non-null value, the column is more permissive than needed (`db/schema.ts` ~line 124)
- `appmaps.metadata_labels` is stored as JSON text but never queried — add a comment clarifying it's an audit field, or remove it if unused
- `compare.ts` fetches both endpoint tables entirely into JS then merges; add a comment noting the O(all routes) cost and the future optimization path (`queries/compare.ts:33`)

## Code

- Double event-count computation: `db/import/appmapRecord.ts:49-53` and `db/import/importAppmap.ts:48-53` each independently scan the events array to count SQL/HTTP events. `ImportResult` should read from the already-stored DB row instead of re-scanning.
- Two resolvers with overlapping semantics: `resolveAppmap()` in `queries/tree.ts` (accepts names) and `resolveAppmapPath()` in `lib/recordingId.ts` (stricter, rejects names). The MCP handler works around the ambiguity by always passing `source_path` explicitly, but a future caller using the wrong one would silently get looser behavior. Consider merging or clearly documenting the distinction.
- Potential stack overflow on pathologically deep recordings — maxFor(), computeTotals(), walk() are all unbounded recursive DFS. Java stack limit is ~500 frames so in practice safe, but there should still be a defensive upper bound.

## Tests

- `renderTreeForMcpBudgeted` (the byte-budgeted breadth-first renderer, default `get_call_tree` path) has no direct unit tests. The clip-marker math, `cutoff_depth`/`partial_depth` accounting, and `directlyClippedSubtree` logic are complex enough to deserve their own cases in `treeRender.spec.ts`.
- `parentEventMap.spec.ts` only tests single-thread scenarios; add a case with two concurrent threads whose call stacks interleave to confirm thread isolation.

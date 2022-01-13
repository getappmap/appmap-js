---
id: unbatched-materialized-query
name: Unbatched materialized query
title: Unbatched materialized SQL query
references:
  CWE-1049: https://cwe.mitre.org/data/definitions/1049.html
impactDomain: Performance
---

Finds large data sets that are queried from the database and loaded into memory.

### Rule logic

Examines all SQL SELECT queries (as opposed to insert/update). If the query satisfies any of the
following conditions:

- Has a LIMIT clause
- Has a COUNT clause at the top level
- Queries only for metadata (`sqlite_master` table)

then the query is skipped.

Otherwise, the rule checks to see if the query has an ancestor labeled `dao.materialize`. If so,
it's emitted as a finding.

### Notes

Materializing large amounts of data code objects is a frequent cause of poor performance and memory
exhaustion.

A `COUNT` or `LIMIT` clause is a good indication that the code is taking steps to limit the amount
of data that's loaded into memory.

### Resolution

If data is being loaded into memory from an un-LIMITed query:

- Consider whether the data processing that's being performed in-memory can be performed in the
  database - either via SQL or a stored procedure.
- If the data is being loaded solely for presentation purposes, fetch data in batches - e.g. with a
  pagination library.

### Options

None

### Examples

```yaml
- rule: unbatchedMaterializedQuery
```

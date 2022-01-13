---
id: too-many-joins
name: Too many joins
title: Too many joins
references:
  CWE-1049: https://cwe.mitre.org/data/definitions/1049.html
impactDomain: Performance
---

Verifies that the number of joins in SQL queries does not exceed a threshold.

### Rule logic

Counts the number of joins in each SQL query. If the count exceeds the configured threshold, a
finding is reported.

### Notes

Queries with too many joins often have poor or unpredictable performance.

### Resolution

Rewrite the query to use fewer joins, or break the query into more than one query.

### Options

- `warningLimit` the maximum number of joins allowed.

### Examples

```yaml
- rule: slowQuery
  properties:
    warningLimit: 5
```

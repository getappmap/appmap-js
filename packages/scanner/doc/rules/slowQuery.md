---
id: slow-query
name: Slow query
title: Slow SQL query
impactDomain: Performance
---

Ensures that SQL query elapsed time does not exceed a threshold.

### Rule logic

Checks all configured queries to see if the elapsed time exceeds the configured threshold.

### Notes

This rule is most useful when applied to code that is specifically designed to test application
performance.

### Resolution

Optimize the elapsed time using SQL tuning.

### Options

- `timeAllowed` max time (in seconds) allowed for the query.

### Examples

```yaml
- rule: slowQuery
  properties:
    timeAllowed: 0.25
```

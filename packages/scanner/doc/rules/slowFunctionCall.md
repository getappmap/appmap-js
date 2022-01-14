---
rule: slow-function-call
name: Slow function call
title: Slow function call
impactDomain: Performance
scope: root
---

Ensures that function elapsed time does not exceed a threshold.

### Rule logic

Checks all configured functions to see if the elapsed time exceeds the configured threshold.

### Notes

This rule is most useful when applied to code that is specifically designed to test application
performance.

### Resolution

Optimize the function elapsed time using a profiler, SQL tuning, etc.

### Options

- `functions: `[MatchPatternConfig](/docs/analysis/match-pattern-config.html)`[]` list of functions
  to check. Required.
- `timeAllowed` max time (in seconds) allowed for the function.

### Examples

```yaml
- rule: slowFunctionCall
  properties:
    timeAllowed: 0.25
    functions:
      - match: ^app/models
      - match: ^app/jobs
```

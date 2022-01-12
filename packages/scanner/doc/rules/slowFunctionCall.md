---
title: Slow function call
id: slow-function-call
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

- `functions: MatchPatternConfig[]` list of functions to check. Required.
- `timeAllowed` max time allowed for the function.

### Examples

```yaml
- rule: slowFunctionCall
  properties:
    timeAllowed: 0.25
    functions:
      - match: ^app/models
      - match: ^app/jobs
```

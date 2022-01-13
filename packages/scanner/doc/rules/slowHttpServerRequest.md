---
id: slow-http-server-request
name: Slow HTTP server request
title: Slow HTTP server request
impactDomain: Performance
---

Ensures that HTTP server request elapsed time does not exceed a threshold.

### Rule logic

Checks HTTP server requests to see if the elapsed time exceeds the configured threshold.

### Notes

This rule is most useful when applied to code that is specifically designed to test application
performance.

### Resolution

Optimize the request elapsed time using a profiler, SQL tuning, etc.

### Options

- `timeAllowed` max time allowed for the request.

### Examples

```yaml
- rule: slowHttpServerRequest
  properties:
    timeAllowed: 0.25
```

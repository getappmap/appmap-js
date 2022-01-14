---
rule: missing-content-type
name: Missing content type
title: HTTP server request without a Content-Type header
impactDomain: Stability
scope: http_server_request
---

Finds HTTP server requests that don't provide a `Content-Type` header in the response.

### Rule logic

Every HTTP server request is checked. If the status code indicates redirect or "No content", then
the rule passes. Otherwise, a finding is issued if the response is missing a `Content-Type` header.

### Notes

When a response is missing the `Content-Type` header, it's unclear to clients how to handle the
response data. Bugs are likely to result.

### Resolution

Provide a `Content-Type` in the response.

### Options

None

### Examples

```yaml
- rule: missingContentType
```

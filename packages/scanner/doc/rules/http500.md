---
id: http-5xx
name: HTTP 5xx
title: HTTP 5xx status code
references:
  CWE-394: https://cwe.mitre.org/data/definitions/394.html
impactDomain: Stability
---

Identifies when an HTTP server requset has returned a 5xx status code. 5xx status codes generally
indicate an unanticipated problem in the backend that is not handled in a predictable way. 5xx
status codes are also hard for client code to handle, because they don't indicate any particular
problem or suggest a solution.

### Rule logic

Any HTTP 5xx status code that's returned by an HTTP server request will be emitted as a finding by
this rule.

### Resolution

The execution trace of request may show an unhandled exception. Or it may show exception or error
handling that failed in some way, and was caught and handled generically by the framework. Use the
trace to figure out the root cause of the problem, and update the code to report the problem using a
more informative HTTP status code.

### Options

None

### Examples

```yaml
- rule: http500
```

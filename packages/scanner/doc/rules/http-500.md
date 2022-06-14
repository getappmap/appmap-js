---
rule: http-500
name: HTTP 500
title: HTTP 500 status code
references:
  CWE-392: https://cwe.mitre.org/data/definitions/392.html
impactDomain: Stability
scope: http_server_request
---

Identifies when an HTTP server request has returned a 500 status code. HTTP 500 status code
generally indicate an unanticipated problem in the backend that is not handled in a predictable way.
500 status codes are also hard for client code to handle, because they don't indicate any particular
problem or suggest a solution.

### Rule logic

An HTTP 500 status code that's returned by an HTTP server request will be emitted as a finding by
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

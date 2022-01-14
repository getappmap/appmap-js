---
id: authz-before-authn
name: Authz before authn
title: Authorization performed before authentication
references:
  CWE-863: https://cwe.mitre.org/data/definitions/863.html
impactDomain: Security
labels:
  - security.authorization
  - security.authentication
scope: http_server_request
---

Determines when authorization logic is applied to a user identity that has not been properly
verified. Because the the user's identity has not been verified yet, the outcome of the
authorization check cannot be trusted. A malicious user might be able to get themselves authorized
as a different user than they really are - or they may not be logged in at all.

### Rule logic

Iterates over all descendants of the HTTP server request. If an event labeled
`security.authentication` is encountered, the rule is satisfied. If an event labeled
`security.authorization` is encountered, and the event returns a truthy value, the descendants of
the authentication event are searched for an event labeled `security.authentication`. If such an
event is found, the rule is satisfied. Otherwise a finding is emitted.

### Notes

A `security.authorization` event which returns a falsey value (`false`, `null`, etc) will not
trigger a finding.

The `security.authentication` event must return a truthy value (`true`, any object) in order to
satisfy the rule.

### Resolution

Ensure that the user's identity is established before performing authorization.

### Options

None

### Examples

```yaml
- rule: authzBeforeAuthn
```

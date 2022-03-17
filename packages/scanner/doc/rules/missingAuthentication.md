---
rule: missing-authentication
name: Missing authentication
title: Unauthenticated HTTP server request
references:
  CWE-306: https://cwe.mitre.org/data/definitions/306.html
impactDomain: Security
labels:
  - access.public
  - security.authentication
scope: http_server_request
---

An HTTP server request is missing authentication. In this case, the request may be serving assets
that should be protected by authentication - but no authentication is actually happening.

### Rule logic

This rule checks all HTTP server requests that satisfy the following conditions:

- HTTP status code is `< 300`
- Matches include and exclude lists of content type (by default, these are empty).

For each matching request, any event that satisfies either of these conditions will satisfy the rule:

1. Has label `public`.
2. Has label `security.authentication`, and returns a truthy value.

### Notes

If a request does not require an authenticated user (e.g. because it contains completely public
information), then this rule can be satisfied by calling any function labeled `public`.

If the `security.authentication` event returns a falsey value (`false`, `null`, etc), then
authentication is assumed to be denied, and the rule is not satisfied.

### Resolution

If the request is designed to be public, and the omission of authentication is intentionaly, modify
the code so that it calls a function labeled `public`.

Otherwise, modify the code so that it calls a function labeled `security.authentication` which
returns a truthy result (for example, a User object).

### Options

- `includeContentTypes: ` [MatchPatternConfig](/docs/analysis/match-pattern-config.html)`[]`.
  Default: empty - including all content types.
- `excludeContentTypes: ` [MatchPatternConfig](/docs/analysis/match-pattern-config.html)`[]`.
  Default: empty - excluding no content types.

### Examples

```yaml
- rule: missingAuthentication
  properties:
    includeContentTypes:
      - match: ^application/json
```

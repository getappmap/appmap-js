---
rule: logout-without-session-reset
name: Logout without session reset
title: Logout without session reset
references:
  CWE-488: https://cwe.mitre.org/data/definitions/488.html
  OWASP - Session fixation: https://owasp.org/www-community/attacks/Session_fixation
  Ruby on Rails - Session fixation countermeasures: >-
    https://guides.rubyonrails.org/security.html#session-fixation-countermeasures
impactDomain: Security
labels:
  - http.session.clear
  - security.logout
scope: http_server_request
---

Determines when a user has been logged out from the application, but the session hasn't been
cleared. When the session isn't cleared after logout, the session is vulnerable to a
[session fixation attack](https://owasp.org/www-community/attacks/Session_fixation).

### Rule logic

Iterates over all descendants of the HTTP server request. If an event labeled `security.logout` is
encountered, the event must have a descendant labeled `http.session.clear`, otherwise a finding is
emitted.

### Notes

Return values from `security.logout` and `http.session.clear` are not checked, as these methods are
assumed to always succeed.

### Options

None

### Examples

```yaml
- rule: logoutWithoutSessionReset
```

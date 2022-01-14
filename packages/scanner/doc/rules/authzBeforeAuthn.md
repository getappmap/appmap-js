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
---

Determines when authorization logic is applied to a user identity that has not been properly
verified. Because the the user's identity has not been verified yet, the outcome of the
authorization check cannot be trusted. A malicious user might be able to get themselves authorized
as a different user than they really are - or they may not be logged in at all.

### Rule logic

### Notes

### Resolution

### Options

### Examples

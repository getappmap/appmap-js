---
name: security.authorization
rules:
  - authz-before-authn
---

Test whether the current authenticated user has permission to make a web request.

Returns `truthy` if the request is allowed; otherwise `falsey`.

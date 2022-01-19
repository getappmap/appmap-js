---
name: security.authentication
rules:
  - authz-before-authn
  - missing-authentication
---

Verifies the identity of an application user.

Returns `truthy` if the user identity is confirmed; otherwise `falsey`.

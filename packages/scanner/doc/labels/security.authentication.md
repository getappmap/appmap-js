---
name: security.authentication
rules:
  - authz-before-authn
  - missing-authentication
---

Indicates that a function verifies the identity of the user in an RPC request.

Returns `truthy` if the user identity is confirmed; otherwise `falsey`.

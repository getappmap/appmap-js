---
name: secret
rules:
  - insecure-compare
  - secret-in-log
---

Indicates that a function returns a secret value. A secret is a user password, cryptographic key,
authentication token, etc that is used for authentication or other verification.

Personally-identifiable information (PII) does not fall under the scope of the `secret` label.

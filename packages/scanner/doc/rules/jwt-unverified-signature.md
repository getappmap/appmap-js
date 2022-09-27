---
rule: jwt-unverified-signature
name: Jwt unverified signature
title: Unverified signature
references:
  CWE-345: https://cwe.mitre.org/data/definitions/345.html
  A02:2021: https://owasp.org/Top10/A02_2021-Cryptographic_Failures
  RFC 7519: https://www.rfc-editor.org/rfc/rfc7519
impactDomain: Security
labels:
  - jwt.decode
  - jwt.signature.verify
---

Finds cases where a JWT is decoded but the signature is never verified. Without proper signature
verification, the service will unknowingly accept arbitrary token payloads from any origin.

### Rule logic

Following a function call to decode a JWT, a subsequent function call to verify the token signature
is expected.

### Options

None

### Examples

```yaml
- rule: jwt-unverified-signature
```

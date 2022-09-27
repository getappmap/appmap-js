---
rule: jwt-algorithm-none
name: Jwt algorithm none
title: JWT 'none' algorithm
references:
  CWE-345: https://cwe.mitre.org/data/definitions/345.html
  A02:2021: https://owasp.org/Top10/A02_2021-Cryptographic_Failures
  RFC 7519: https://www.rfc-editor.org/rfc/rfc7519
impactDomain: Security
labels:
  - jwt.encode
---

Finds usage of unsecured JWTs which use the `none` algorithm. When declaring this algorithm, there
is no signature contained within the token that may be cryptographically verified. As a result, the
data encoded within the token may be easily forged.

### Rule logic

Any function which encodes a new JWT will have its return value checked for presence of the `none`
algorithm within the token header.

### Options

None

### Examples

```yaml
- rule: jwt-algorithm-none
```

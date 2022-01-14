---
id: insecure-compare
name: Insecure compare
title: Insecure comparison of secrets
references:
  CWE-208: https://cwe.mitre.org/data/definitions/208.html
impactDomain: Security
labels:
  - secret
  - string.equals
---

Identifies cases in which secrets are being compared directly using `string.equals`.

Ordinary string comparison of user-provided data with a piece of secret data can leak information
about the secret through [timing attacks](https://en.wikipedia.org/wiki/Timing_attack), because of
short-circuting (returning false on first mismatch). This can allow the attacker to significantly
speed up brute forcing, turning an intractable exponential problem into a linear one.

### Rule logic

The rule looks for events labeled `secret` and `string.equals`.

On encountering an event labeled `secret` it remembers the return value.

On encountering `string.equals` it looks at the arguments and the receiver. If any of the arguments
is a previously seen secret, or matches a list of known secret-like regular expressions, the
comparison is flagged as insecure, unless any of the arguments is a BCrypt digest.

### Notes

When generating appmaps, ensure that string comparison functions (such as `String#==` in Ruby and
`String.equals` in Java) are traced and correctly labeled with `string.equals`. Any functions you
know to return a secret (eg. a model accessor for an API key) should be labeled `secret`.

Since using this rule generally requires labeling all string comparisons its use is currently
limited due to performance and space overhead of tracing them: string comparisons are commonly used
throughout the code base and libraries.

It's advisable to only trace string equality on a limited subset of tests (perhaps the ones known to
touch secret related functionality); alas, this is not something easily attainable with current
AppMap recorders and requires swapping or modifying configuration files.

### Resolution

To fix this issue, either hash values before comparing or use a constant-time comparison in such
operations. Constant-time comparison functions always compare every character of the string,
removing the timing side channel. You can usually find functions like this in cryptographic and
utility libraries, eg. `ActiveSupport::SecurityUtils.secure_compare`.

### Options

None

### Examples

```yaml
- rule: insecureCompare
```

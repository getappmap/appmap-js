---
rule: deserialization-of-untrusted-data
name: Deserialization of untrusted data
title: Deserialization of untrusted data
references:
  CWE-502: https://cwe.mitre.org/data/definitions/502.html
  Ruby Security: https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html
impactDomain: Security
labels:
  - deserialize.unsafe
  - deserialize.safe
  - sanitize
---

Finds occurrances of deserialization in which the mechanism employed is known to be unsafe, and the
data is not known to be trusted.

### Rule logic

Finds all events labeled `deserialize.unsafe`, that are not a descendant of an event labeled
`deserialize.safe`. For each of these events, all event parameters are checked.

Each parameter whose type is `string` or `object` is verified to ensure that it's trusted. For data
to be trusted, it must be the return value of a function labeled `sanitize`.

### Notes

With insecure deserialization, it is usually possible for an attacker to craft a malicious payload
that executes code shortly after deserialization.

### Resolution

If you can guarantee that you are using unsafe deserialization in a safe way, but it's not possible
to obtain the raw data from a function labeled `sanitize`, you can wrap the deserialization in a
function labeled `deserialize.safe`.

If you need to deserialize untrusted data, JSON is often a good choice as it is only capable of
returning ‘primitive’ types such as strings, arrays, hashes, numbers and nil. If you need to
deserialize other classes, you should handle this manually. Never deserialize to a user specified
class¹.

Ensure that the JSON library provided by your language and framework does not perform unsafe
deserialization.

1. https://docs.ruby-lang.org/en/3.0/doc/security_rdoc.html

### Options

None

### Examples

```yaml
- rule: deserializationOfUntrustedData
```

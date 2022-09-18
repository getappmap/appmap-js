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
  - deserialize.sanitize
scope: http_server_request
---

Finds occurrances of deserialization in which the mechanism employed is known to be unsafe, and the
data comes from an untrusted source and hasn't passed through a sanitization mechanism.

### Rule logic

Finds all events labeled `deserialize.unsafe` that receive tainted data (as determined by object
identity or string value) as an input.

For each of these events; checks if all the inputs have been sanitized.

Data that has been passed to a function labeled `deserialize.sanitize` is assumed to be sanitized
from this point onwards. Such a function could either check the value is sanitized (note no
verification is currently done to ensure this result is checked) or return the transformed value
after any necessary sanitization.

Data passed to a function labeled `deserialized.safe` is considered in all functions called by it
(down the callstack). Functions that first sanitize data and then use an unsafe deserialization
function should carry this label.

The set of tracked tainted data initially includes the HTTP message parameters and is expanded to
include any non-primitive (ie. longer than 5 characters) observed outputs of functions that consume
tainted data.

The reliability of this rule now depends on completeness of the AppMap. If there is a data
transformation that is not captured it's invisible to the rule and will result in failure to
associate it with the tracked untrusted data.

### Notes

With insecure deserialization, it is usually possible for an attacker to craft a malicious payload
that executes code shortly after deserialization.

### Resolution

Consider if the library you're using offers a safe deserialization function variant that you can use
instead. Using unsafe functions is only rarely needed and typically requires a good reason.

If you need to use the unsafe function, make sure you're able to handle unexpected input safely.
Sanitize the data thoroughly first; label the sanitization function with `deserialize.sanitize`
label or wrap the whole sanitization and deserialization logic in a function labeled
`deserialize.safe`.

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

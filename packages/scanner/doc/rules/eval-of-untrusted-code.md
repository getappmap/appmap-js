---
rule: eval-of-untrusted-code
name: Eval of untrusted code
title: Evaluation of untrusted code
references:
  CWE-95: https://cwe.mitre.org/data/definitions/95.html
impactDomain: Security
labels:
  - lang.eval
  - lang.eval.safe
  - lang.eval.sanitize
---

Find occurrances of code evaluation in which the evaluated code string is not guaranteed to be safe.

### Rule logic

Find all events labeled `lang.eval` that are not a descendant of an event labeled `lang.eval.safe`.
For each of these events, all event parameters are checked.

Each parameter whose type is `string` or `object` is verified to ensure that it's trusted. For data
to be trusted, it must be the return value of a function labeled `lang.eval.sanitize`.

### Resolution

If you can guarantee that you are using code evaluation in a safe way, but it's not possible to
obtain the raw data from a function labeled `lang.eval.sanitize`, you can wrap the system command in
a function labeled `lang.eval.safe`.

### Options

None

### Examples

```yaml
- rule: evalOfUntrustedCode
```

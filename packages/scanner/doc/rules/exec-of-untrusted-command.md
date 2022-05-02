---
rule: exec-of-untrusted-command
name: Exec of untrusted command
title: Execution of untrusted system command
references:
  CWE-78: https://cwe.mitre.org/data/definitions/78.html
impactDomain: Security
labels:
  - system.exec
  - system.exec.safe
  - system.exec.sanitize
---

Find occurrances of system command execution in which the command string is not guaranteed to be
safe.

### Rule logic

Find all events labeled `system.exec` that are not a descendant of an event labeled
`system.exec.safe`. For each of these events, all event parameters are checked.

Each parameter whose type is `string` or `object` is verified to ensure that it's trusted. For data
to be trusted, it must be the return value of a function labeled `system.exec.sanitize`.

### Resolution

If you can guarantee that you are using system command execution in a safe way, but it's not
possible to obtain the raw data from a function labeled `system.exec.sanitize`, you can wrap the
system command in a function labeled `system.exec.safe`.

### Options

None

### Examples

```yaml
- rule: execOfUntrustedCommand
```

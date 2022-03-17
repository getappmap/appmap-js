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


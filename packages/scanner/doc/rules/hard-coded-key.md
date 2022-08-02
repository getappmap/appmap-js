---
rule: hard-coded-key
name: Hard coded key
title: Hard-coded key
references:
  A02:2021: https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
impactDomain: Security
labels:
  - crypto.encrypt
  - crypto.decrypt
  - crypto.set_key
  - string.unpack
---

Finds occurrances in which a cryptographic key is used that is not provided by a function.

`string.unpack` functions are an exception, because they are only modifying, not creating, the key.

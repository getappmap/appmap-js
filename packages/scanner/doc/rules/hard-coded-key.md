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
scope: root
---
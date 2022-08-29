---
rule: deprecated-crypto-algorithm
name: Deprecated crypto algorithm
title: Deprecated cryptographic algorithm
references:
  A02:2021: https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
impactDomain: Security
impactSubdomains:
  - 'Security :: Cryptographic failure'
labels:
  - crypto.encrypt
  - crypto.decrypt
  - crypto.digest
scope: root
---

Ensure that cryptographic operations do not use deprecated algorithms.

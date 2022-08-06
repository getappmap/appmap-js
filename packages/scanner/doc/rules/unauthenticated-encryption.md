---
rule: unauthenticated-encryption
name: Unauthenticated encryption
title: Unauthenticated encryption
references:
  A02:2021: https://owasp.org/Top10/A02_2021-Cryptographic_Failures/
impactDomain: Security
labels:
  - crypto.encrypt
  - crypto.set_auth_data
scope: root
---

Ensure that encryption operations use authenticated encryption.

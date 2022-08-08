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
---

Ensures that encryption operations use authenticated encryption.

### Rule logic

Finds all events labeled `crypto.encrypt`. For each of these events, there should be another event
in the same AppMap that has the same `receiver.object_id` and also has the label
`crypto.set_auth_data`.

### Notes

[OWASP recommends against the use of unauthenticated encryption](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/).

### Resolution

Change the encryption code to use a current authenticated encryption algorithm. At the time of this
writing, an example is `aes-256-gcm`.

Examples:

- [`OpenSSL::Cipher#auth_data=` (Ruby)](https://ruby-doc.org/stdlib-3.1.1/libdoc/openssl/rdoc/OpenSSL/Cipher.html#method-i-auth_data-3D)

### Options

None

### Examples

```yaml
- rule: unauthenticated-encryption
```

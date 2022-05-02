---
name: lang.eval.sanitize
rules:
  - eval-of-untrusted-code
---

Ensures that data is safe and trusted for code execution, transforming it if necessary, and
returning `falsey` or raising an exception if it's impossible to make the data safe.

A function with this label can be used to convert untrusted data such as direct user input or HTTP
request parameters into trusted data.

Note that this is not the same as ensuring that a parameter satisfies business logic constraints -
such as presence or max length. It's a security check that ensures the data cannot cause harm when
evaluated as a code string.

To be considered successful, a `lang.eval.sanitize` function must return a `truthy` value.


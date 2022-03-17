---
name: system.exec.sanitize
rules:
  - exec-of-untrusted-command
---

Ensures that data is safe and trusted for use as a system command, transforming it if necessary, and
returning `falsey` or raising an exception if it's impossible to make the data safe.

A function with this label can be used to convert untrusted data such as direct user input or HTTP
request parameters into trusted data.

Note that this is not the same as ensuring that a parameter satisfies business logic constraints -
such as presence or max length. It's a security check that ensures the data cannot cause harm when
used as a system command.

To be considered successful, a `system.exec.sanitize` function must return a `truthy` value.

## Examples

- Ensuring that a user-provided file path is a subdirectory of a known allowed directory.
- Ensuring that a system command string does not have any potential injection or side-effects.

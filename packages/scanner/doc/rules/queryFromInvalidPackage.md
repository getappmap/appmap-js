---
title: Query from invalid package
id: query-from-invalid-package
---

Ensures that SQL queries are made only from an approved list of packages. This helps to make the
code more maintainable by encapsulating access to the database.

### Notes

When too many packages are performing direct SQL queries, it's very hard to keep the code modular.
The result is a lack of coherent design and degredation in maintainability.

### Rule logic

All functions which make SQL queries are inspected. Each one must match one of the
`allowedPackages`.

### Resolution

The code which is making the direct query should be refactored to use the database through one of
the allowed packages.

### Options

- `allowedPackages: MatchPatternConfig[]`. Packages which are allowed to make queries. Required.
- `allowedQueries: MatchPatternConfig[]`. Queries which are allowed from anywhere. Default:
  `[/\bBEGIN\b/i, /\bCOMMIT\b/i, /\bROLLBACK\b/i, /\bRELEASE\b/i, /\bSAVEPOINT\b/i]`.

### Examples

```yaml
- rule: queryFromInvalidPackage
  properties:
    callerPackages:
      - equal: actionpack
    calleePackage:
      equal: app/controllers
```

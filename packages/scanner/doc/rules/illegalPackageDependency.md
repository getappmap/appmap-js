## Description

Ensures that all calls to a specified `callee` package come from an approved `caller` package. This
is a way of defining and enforcing an architectural constraint that may not be provided by the
programming language itself.

## Notes

Many programming languages do not provide a way to make a package "private" or "protected" in the
same way as a class or function. Yet, it's often desirable to limit the places from which code in a
certain package can be called. This rule provides a way to define and enforce this type of
architectural constraint.

## Rule logic

All packages which call the `calleePackage` are inspected. Each one must match one of the
`callerPackage` options.

## Resolution

The code which is illegally calling into the `calleePackage` should be refactored to call one of the
allowed `callerPackages` instead. If the needed functionality is not available on a `callerPackage`,
then one of the `callerPackages` should be modify to provide it.

## Options

- `callerPackages: MatchPatternConfig[]`. Packages which are allowed to call the `calleePackage`.
  Required.
- `calleePackage: MatchPatternConfig`. Package whose callers should be checked. Required.

## Examples

```yaml
- rule: illegalPackageDependency
  properties:
    callerPackages:
      - equal: actionpack
    calleePackage:
      equal: app/controllers
```

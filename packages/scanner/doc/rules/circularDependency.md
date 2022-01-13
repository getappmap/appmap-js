---
id: circular-dependency
name: Circular dependency
title: Circular package dependency
references:
  CWE-1047: https://cwe.mitre.org/data/definitions/1047.html
impactDomain: Maintainability
---

Finds cycles in the package dependency graph. Cyclic dependencies make code hard to maintain,
because all the code in the cycle is inter-dependent. While it might look like the code in the
different packages has separate functions, in essence all the code in the cycle acts like one big
package.

### Rule logic

Builds the package dependency graph, in which each package is a graph node, and each function call
from one package to another is an edge. The edges are directional, pointing from the caller package
to the callee package.

A graph traversal finds cycles - a cycle being a path which starts with a package (a node),
traverses through other packages (via edges), and returns to the original package.

For each package cycle that's detected in the call graph, the rule then searches for a sequence of
function calls that matches the cycle. This sequence of events is returned in the finding.

### Notes

There may be multiple paths through the event trace that produce a given package cycle. Only one of
these paths is reported in the finding.

### Resolution

If a package in the circular dependency is designed to call back into the code that call it, it can
be added to the `ignoredPackages` list. This is common with helper and middleware code.

Otherwise, you can fix the cyclic dependency by refactoring the code. One way to do this is to
refactor some of the code into a new package, class, or library.

### Options

- `depth`. Minimum number of packages in a path that will be reported. Default: 4.
- `ignoredPackages MatchPatternConfig[]`. Packages which match this pattern are not included in the
  dependency graph. Default: empty - including all packages.

### Examples

```yaml
- rule: circularDependency
  properties:
    depth: 4 # default
    ignoredPackages:
      - equal: activesupport
      - equal: app/helpers
```

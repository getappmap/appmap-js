---
layout: docs
title: Docs - Guides
guides: true
name: Configuring Analysis
step: 6
redirect_from: [/docs/analysis/match-pattern-config, /docs/analysis/findings,/docs/reference/configuring-analysis]
---

# Configuring Analysis <!-- omit in toc -->

- [Configuring checks](#configuring-checks)
  - [Example appmap-scanner.yml](#example-appmap-scanneryml)
- [Match pattern config](#match-pattern-config)
  - [Examples](#examples)
- [Findings Reference](#findings-reference)
  - [Properties](#properties)
  - [Finding hash](#finding-hash)


## Configuring checks

AppMap Analysis is configured in a YAML document. It's primary job is to specify which scanner rules will check the code.
Each check specifies a rule id, and may include additional properties that customized and tune the behavior of the rule.

AppMap Analysis ships with a default configuration file located in `node_modules/@appland/scanner/built/sampleConfig/default.yml`.  

Without specifying the `--config` command line option, AppMap will attempt to load `appmap-scanner.yml`, the default configuration for analysis rules. If that file does not exist, AppMap will fail back to loading the configuration in the `node_modules` path. 

To use a non-default configuration, specify the path to the configuration file via the `-c` or `--config` option:

```sh
$ npx @appland/scanner \
    --appmap-dir tmp/appmap \
    --config appmap-scanner.yml \
    ci
```
{: .example-code}

To use a custom configuration create a file named `appmap-scanner.yml` in the root of your project directory, you can copy the [default.yml](https://github.com/getappmap/appmap-js/blob/main/packages/scanner/src/sampleConfig/default.yml) in the AppMap source code as a starting point.  Refer to the [Rules Reference](/docs/reference/analysis-rules) for additional configuration options per scanner rule. 

### Example appmap-scanner.yml

```
checks:
  - rule: authzBeforeAuthn
  - rule: http500
  - rule: illegalPackageDependency
    properties:
      callerPackages:
        - equal: actionpack
      calleePackage:
        equal: app/controllers
  - rule: insecureCompare
  - rule: missingAuthentication
  - rule: missingContentType
  - rule: nPlusOneQuery
  - rule: secretInLog
  - rule: slowFunctionCall
    properties:
      timeAllowed: 0.2
      functions:
        - match: Controller#create$
  - rule: slowHttpServerRequest
    properties:
      timeAllowed: 0.5
  - rule: slowQuery
    properties:
      timeAllowed: 0.05
  - rule: tooManyJoins
  - rule: tooManyUpdates
  - rule: unbatchedMaterializedQuery
  - rule: updateInGetRequest
```

## Match pattern config

Some rule options are defined as type `MatchPatternConfig`. `MatchPatternConfig` is a flexible way to
match a string such as content type, code object name, etc.

Each `MatchPatternConfig` requires one of the following three YAML keys:

```yaml
- match: RegExp   # String value must match this regexp
- include: string # String value must include this substring
- equal: string   # String value must equal this string
```
{: .example-code}

Optionally:

```yaml
- ignoreCase: boolean # When true, the match/include/equal test is case-insensitive
```
{: .example-code}

### Examples

The `illegalPackageDependency` rule is applied to the package `app/controllers` (exactly). The caller package must
be `actionpack` (exactly).

```
  - rule: illegalPackageDependency
    properties:
      callerPackages:
        - equal: actionpack
      calleePackage:
        equal: app/controllers
```

The `slowFunctionCall` rule is applied to all functions that match one of two regular expressions (case sensitive).

```
  - rule: slowFunctionCall
    properties:
      functions:
        - match: ^app/models
        - match: ^app/jobs
```

The `missingAuthentication` rule is *not applied* to any event whose `route` includes `/api/`.

```
  - rule: missingAuthentication
    exclude:
      - event:
          property: route
          test:
            include: /api/
```

## Findings Reference

When a scanner check matches an AppMap, it issues a _finding_.  A finding includes detailed information about the match, indicating such information as:

* A title and message.
* AppMap in which the finding was found.
* The primary and secondary events that are relevant to the finding.

### Properties

* `ruleId` identifier of the [rule](/docs/reference/analysis-rules) algorithm.
* `checkId` identifier of the `check`, which a configured instance of a `rule`.
* `ruleTitle` human-friendly title of the rule.
* `message` human-friendly message describing the finding.
* `appMapFile` relative path to the [AppMap](https://github.com/getappmap/appmap#appmap-data-specification) file containing the match.
* `event` JSON object of the primary [event](https://github.com/getappmap/appmap#events) on which the match was found.
* `relatedEvents` JSON of other events in the AppMap which are associated with the finding. They can be inspected in the AppMap to better understand the finding.
* `scope` JSON of the event which defines the AppMap subtree in which the finding was discovered. 
* [`hash`](#finding-hash) of the finding which can be used to identify duplicate findings.

### Finding hash

A `hash` of the finding is computed from the finding properties that are most important and characteristic. The hash is used implement a critical feature of AppMap Analysis - de-duplication. De-duplication serves two purposes:

1) A finding may occur many times within a set of AppMaps. As a user, you're only interested in unique findings, therefore the hash can be used to de-duplicate the findings and present a minimal data set.
2) Findings can be managed and triaged in the [AppMap Server](https://app.land) UI. For example, a finding can be deferred to prevent that finding from holding up a build or pull request. If the finding occurs again in the future, the hash is used to recognize that the finding has already been found, triaged - therefore the finding is not reported as new, and does not block the build or need to be re-triaged.

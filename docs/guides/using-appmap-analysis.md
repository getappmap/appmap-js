---
layout: docs
title: Docs - Guides
description: "Configure AppMap Analysis by customizing checks for flexible rule options. Understand findings and their properties for effective analysis."
guides: true
name: Using AppMap Analysis
step: 8
redirect_from: [/docs/analysis/configuring-checks, /docs/analysis/match-pattern-config, /docs/analysis/findings,/docs/reference/configuring-analysis,/docs/guides/configuring-analysis, /docs/analysis]
---

# AppMap Analysis

When there is AppMap Data available in your project, AppMap Runtime Analysis will immediately scan them to detect flaws in the code. These flaws are surfaced as **findings** and are displayed in your code editor as you work so that they can be addressed **before** they are propagated to test or production environments.

- [Navigate Findings](#navigate-findings)
- [Investigate findings](#investigate-findings)
- [Use labels to visually explore your code](#use-labels-to-visually-explore-your-code)
- [Configuring Analysis](#configuring-analysis)
- [Configuring checks](#configuring-checks)
  - [Example appmap-scanner.yml](#example-appmap-scanneryml)
- [Match pattern config](#match-pattern-config)
  - [Examples](#examples)
- [Findings Reference](#findings-reference)
  - [Properties](#properties)
  - [Finding hash](#finding-hash)

## Navigate Findings

Findings are displayed In the Runtime Analysis sidebar pane sorted by impact category and type.

<image class="video-screenshot" src="/assets/img/docs/runtime-analysis-sidebar-findings.webp"/> 

Clicking the ‘Overview’ link in the Runtime Analysis sidebar will open the ‘Runtime Analysis Summary’ window which contains a summary of findings for a particular project.

<image class="video-screenshot" src="/assets/img/docs/runtime-analysis-overview-dashboard.webp"/> 

{% include vimeo.html id='916087872' %}

---

**In this video**  
AppMap Analysis scans your AppMap Data to find software design flaws that impact performance, stability, security and maintainability. This runtime code analysis can find the problems that static code analyzers miss - and that cause 90% of today’s most serious production issues.

**Links mentioned**  
[AppMap Community Slack](/slack)  
[Get AppMap for VSCode](https://marketplace.visualstudio.com/items?itemName=appland.appmap)  
[Get AppMap for JetBrains](https://plugins.jetbrains.com/plugin/16701-appmap)

---

## Investigate findings

Let's look at a sample Ruby on rails application, where AppMap has already been installed and AppMap Data has been generated. From the test cases, you'll see a new option for findings in the left-hand column or an option here for investigate findings.

<img class="video-screenshot" src="/assets/img/appmap-analysis-1.webp"/>

You can see one of the issues we've found is that a log event contained secret data by clicking on the finding will be taken directly to the line of code where this event occurs by hovering over the pin.
<img class="video-screenshot" src="/assets/img/appmap-analysis-2.webp"/>

## Use labels to visually explore your code

You can open the AppMap and see exactly where the function wrote this secret to a log file. How does AppMap know that this was a secret? Unlike static analyzers and other tools that do pattern matching AppMap knows this function generates secrets because we have built in knowledge of common software libraries with pre-populated labels.

We know exactly where to look to avoid false positives. Developers can extend their labels, whether it's a common library or not with simple code comments on their functions.
<img class="video-screenshot" src="/assets/img/appmap-analysis-3.webp"/>

If you search for the secret label, you'll see the location in the code where this event occurs by clicking on the function, you'll be taken to the exact location of the AppMap, where the secret was generated. Additionally, you can open the code, combining a visual model alongside the code.
<img class="video-screenshot" src="/assets/img/appmap-analysis-4.webp"/>

## Configuring Analysis Checks

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

1) A finding may occur many times within a set of AppMap Diagrams. As a user, you're only interested in unique findings, therefore the hash can be used to de-duplicate the findings and present a minimal data set.
2) Findings can be managed and triaged in the [AppMap Server](https://app.land) UI. For example, a finding can be deferred to prevent that finding from holding up a build or pull request. If the finding occurs again in the future, the hash is used to recognize that the finding has already been found, triaged - therefore the finding is not reported as new, and does not block the build or need to be re-triaged.

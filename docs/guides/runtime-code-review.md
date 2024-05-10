---
layout: docs
title: Docs - Guides
description: "AppMap analyzes runtime changes in your codebase for failed tests, API, security, performance issues, and anti-patterns, providing detailed reports."
guides: true
name: Understanding the Runtime Code Review Report
step: 10
---

# Understanding the Runtime Code Review Report <!-- omit in toc -->

AppMap Analysis works with your Continuous Integration (CI) system to collect, store, analyze, and report on the behavioral changes within each Pull Request. AppMap analyzes the changes in your application on each pushed commit or pull request. AppMap performs a thorough analysis of the runtime differences, giving you:

- Root cause analysis of failed tests.
- Web service API changes - breaking and non-breaking - via comparison of generated OpenAPI definitions.
- New and resolved security vulnerabilities.
- New and resolved performance issues.
- New and resolved flaws in other categories - maintainability, reliability, and user-defined rules.
- Code Behavior diffs represented as sequence diagrams showing changed runtime behavior within the PR.

<img class="video-screenshot" src="/assets/img/docs/guides/runtime-code-review.webp"/> 

- [The AppMap Change Report](#the-appmap-change-report)
- [Summary and Status](#summary-and-status)
  - [Failed Tests](#failed-tests)
  - [API Changes](#api-changes)
  - [Security Flaws](#security-flaws)
  - [Performance Problems](#performance-problems)
  - [Code Anti-Patterns](#code-anti-patterns)
  - [New AppMap Diagrams](#new-appmap-diagrams)

## The AppMap Change Report

Once a Pull Request is opened, reopened, or changed, an AppMap Analysis command will run to build a comparison report between the head revision and the most recent base revision for which an AppMap archive is available.  This ensures AppMap is only analyzing the code which changed in the pull request. This report compares structural differences observed at runtime between the feature and the origin point of that feature branch. The same action can also add comments and annotations to the source code changes involved in the Pull Request. The report data is also available as a JSON file.

Key insights include:

- How the new code will impact the system.
- Any major architectural changes introduced.
- Changes to the code interactions from API to Database

Here is an example of a report from AppMap in CI:

<img class="video-screenshot" src="/assets/img/docs/gh-action/analysis-github-action.webp"/>

This report shows the runtime analysis done by AppMap, which records code execution behavior *before* those changes are approved for deployment to production.

<img class="video-screenshot" src="/assets/img/docs/appmap_CI_report_top.webp"/> 

## Summary and Status

The summary gives you an overview of the following code-related flaws, problems, and anti-patterns. 

- [The AppMap Change Report](#the-appmap-change-report)
- [Summary and Status](#summary-and-status)
  - [Failed Tests](#failed-tests)
  - [API Changes](#api-changes)
  - [Security Flaws](#security-flaws)
  - [Performance Problems](#performance-problems)
  - [Code Anti-Patterns](#code-anti-patterns)
  - [New AppMap Diagrams](#new-appmap-diagrams)


### Failed Tests

AppMap will report on any tests that failed as part of your test suite. For each test that failed to complete successfully, AppMap will analyze the failed test, showing the full details of the error and the specific part of the test that failed. 

<img class="video-screenshot" src="/assets/img/docs/appmap_CI_report_failed_tests.webp"/> 

### API Changes

AppMap will report on any changes seen with your API routes at runtime. AppMap will identify changes to routes themselves, notifying you when a new route appears or an existing route is deleted. Additionally, it will identify changes to the response body, content, descriptions, and other attributes.

<img class="video-screenshot" src="/assets/img/docs/appmap_CI_report_api_changes.webp"/> 

### Security Flaws

AppMap analyzes your application's behavior to identify new security flaws in how the new code changes execute.  AppMap can identify issues such as:

- [Deprecated cryptography algorithm](/docs/reference/analysis-rules.html#deprecated-crypto-algorithm)
- [Logout without Session Reset](/docs/reference/analysis-rules.html#logout-without-session-reset)
- [Deserialization of untrusted data](/docs/reference/analysis-rules.html#deserialization-of-untrusted-data)
- and others.

For a full list of all the flaws and issues which AppMap can detect, refer to the [Analysis Rules](/docs/reference/analysis-rules) reference section.

### Performance Problems

AppMap analyzes software behavior changes in your code base to identify performance problems before you merge your code changes. AppMap identifies a variety of software performance problems such as:

- [N Plus One SQL Query](/docs/reference/analysis-rules.html#n-plus-one-query)
- [Slow Function Calls](/docs/reference/analysis-rules.html#slow-function-call)
- [Slow HTTP Server Requests](/docs/reference/analysis-rules.html#slow-http-server-request)
- and others. 

For a full list of all the flaws and issues which AppMap can detect, refer to the [Analysis Rules](/docs/reference/analysis-rules) reference section.

### Code Anti-Patterns

AppMap can identify any major or potential structural flaws in the architecture, or logical flow that could be introduced due to merging the feature into your application. Some examples of these code anti-patterns that AppMap can identify are: 

- [Circular Dependencies](/docs/reference/analysis-rules.html#circular-dependency)
- [Too Many SQL or RPC Updates](/docs/reference/analysis-rules.html#too-many-updates)
- [SQL Queries from View Layer](/docs/reference/analysis-rules.html#query-from-view)
- and others. 

For a full list of all the flaws and issues which AppMap can detect, refer to the [Analysis Rules](/docs/reference/analysis-rules) reference section.

### New AppMap Diagrams

New test cases added to a pull request will lead to new AppMap Diagrams being created, with one AppMap created for each new test. AppMap will list all of the new diagrams (and therefore, each new test) created in each pull request. 
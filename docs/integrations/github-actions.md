---
layout: docs
title: Docs - Integrations
integrations: true
name: GitHub Actions
step: 2
---

# GitHub Actions

<p class="alert alert-info">
To get started with the AppMap GitHub Action,  <a href="/docs/setup-appmap-in-ci/in-github-actions">refer to the setup documentation</a>
</p>

AppMap Analysis can work within GitHub Actions to collect, store, analyze, and report on the behavioral changes within each Pull Request. AppMap will analyze the changes in your application on each pushed commit or pull request. AppMap performs a thorough analysis of the runtime differences, giving you:

Root cause analysis of failed tests.
Web service API changes, both breaking and non-breaking.
New and resolved security findings.
New and resolved performance findings.
New and resolved findings in other categories: maintainability, reliability, and user-defined rules.
“Behavioral diffs” as sequence diagrams showing changed runtime behavior within the PR.

Refer to the [Getting Started with GitHub Actions Documentation](/docs/setup-appmap-in-ci/in-github-actions.html) to learn more about how to integrate GitHub Actions with AppMap
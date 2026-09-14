---
layout: docs
title: Docs - Reference
description: "Reference for AppMap Gold Traces: curated recordings of runtime behavior, committed in git, that provide a behavioral baseline for AI-assisted code review."
toc: true
reference: true
step: 10.5
name: AppMap Gold Traces
---

# AppMap Gold Traces <!-- omit in toc -->

- [Overview](#overview)
- [Concepts](#concepts)
  - [Gold traces](#gold-traces)
  - [The manifest](#the-manifest)
- [Prerequisites](#prerequisites)
- [Storage in the repository](#storage-in-the-repository)
  - [Multi-module projects](#multi-module-projects)
- [Setup](#setup)
  - [Initialize the gold traces directory](#initialize-the-gold-traces-directory)
  - [Curate and commit the initial baseline](#curate-and-commit-the-initial-baseline)
- [Local workflow](#local-workflow)
  - [Updating gold traces](#updating-gold-traces)
  - [Reviewing a change](#reviewing-a-change)
- [Running in CI](#running-in-ci)
- [Properties of a good gold trace](#properties-of-a-good-gold-trace)
  - [Minimal spanning set](#minimal-spanning-set)
  - [End-to-end](#end-to-end)
  - [Minimally sized](#minimally-sized)
  - [Deterministic](#deterministic)
  - [Sanitized](#sanitized)
- [Build pipeline and scanning](#build-pipeline-and-scanning)
  - [Secret and PII scanning](#secret-and-pii-scanning)
  - [Test coverage scanning](#test-coverage-scanning)
  - [Dependency scanning](#dependency-scanning)
  - [Merge conflicts](#merge-conflicts)
- [Manifest reference](#manifest-reference)
- [GitHub repositories](#github-repositories)

## Overview

An AppMap trace is a recording of what the application actually did when it ran: the calls it made, in what order, and the queries it issued. To learn how AppMap trace data ("AppMap Data") is recorded, see [Making AppMap Data](/docs/get-started-with-appmap/making-appmap-data).

AppMap gold traces are curated, minimally sized recordings of an application's runtime behavior — capturing function calls, HTTP routes, and SQL queries — driven by a representative subset of the test suite. Gold traces are sanitized and committed in git alongside the application code. This pure git workflow allows developers to explicitly track and inherit changes to application paths across different branches and commits. The provenance of each gold trace is managed by git.

By comparing gold traces from a base revision to a head revision, and correlating these changes to the source code diff, development teams can obtain deep insight into runtime code changes. These include security-impacting changes, API changes and drift, SQL query impact analysis, unexpected side effects of code changes, and more.

People do not read the trace files. The trace files are data for the tools. People read what the tools produce from them: a summarized, interpreted review of the behavior changes, backed by the traces and supported by AppMap diagrams, which are human-readable.

## Concepts

### Gold traces

Gold traces are traces that are selected to provide representative coverage of the key application code paths. Gold traces are selected from a curated subset of the test suite. At least one representative trace should be included per release-critical subsystem, with additional traces for materially different execution paths.

### The manifest

The file `gold_traces/manifest.yaml` lists the test cases that have been selected as gold traces, along with the commands used to record them. See the [Manifest reference](#manifest-reference) for the file format.

## Prerequisites

- **AppMap recording** — the project is configured to record AppMap Data from its test cases, using the appropriate [language recording agent](/docs/reference/) and an `appmap.yml` configuration file. See [Making AppMap Data](/docs/get-started-with-appmap/making-appmap-data). The `appmap-record` skill can assist with this setup.
- **AppMap CLI** — the [CLI](/docs/reference/appmap-client-cli) provides helper commands to process and analyze the AppMap trace data, including [`sanitize`](/docs/reference/appmap-client-cli#sanitize) and [`compare`](/docs/reference/appmap-client-cli#compare).
- **git** — git provides storage and management of the AppMap trace data. No shared AppMap service or separate trace store is required.
- **AI coding agent and the AppMap skills** — the skills are provided in the open source repository [getappmap/skills](https://github.com/getappmap/skills): `appmap-gold-traces` and `appmap-review`, supported by `appmap-record` and `appmap-label`. A coding agent (such as Claude Code or GitHub Copilot CLI) is required to use the skills. The gold traces capability can be utilized without the AI agent skills, but using an agent with the skills makes the process much more streamlined and efficient.

## Storage in the repository

Gold traces are stored and managed in the `gold_traces/` directory:

- `gold_traces/manifest.yaml` — the manifest: record commands plus the curated entries.
- `gold_traces/baseline/appmaps/` — the committed, sanitized baseline recordings.

Gold trace files are committed in git along with the code. They are flagged as binary data in `.gitattributes`, so that git does not try to merge them. Everything derived from the baselines — sequence diagrams, archives, the review — is produced on demand under the `.appmap/` directory, which is gitignored and never committed.

Gold trace files flow through git branches according to the branch strategy that's established for the project. Each branch carries the trace set committed with that branch. Checking out a branch, commit, or release tag retrieves the code and the trace set stored at that revision. Gold traces adopt the organization's existing branching strategy; they add no branches or rules of their own.

Similar to documentation, gold traces may be updated continuously as the developer works, or may be updated in larger batches when code integration is performed. As with most development tasks, small batches work best.

### Multi-module projects

For multi-module projects, each sub-module may have its own `gold_traces/` directory. A `gold_traces/` directory per module keeps traces versioned and reviewed alongside the code they guard, and lets modules be recorded and blessed independently. A single repo-root directory is fine when the repo is effectively one project.

## Setup

A one-time setup process is required to configure a repository for gold traces. Once performed, this configuration is committed to the repo, and does not need to be performed again in the future. The `appmap-gold-traces` skill assists with both steps below; they assume the [Prerequisites](#prerequisites) are in place.

### Initialize the gold traces directory

- Create the `gold_traces/` directory.
- Update `.gitattributes` to treat the baseline trace files as binary:
  ```
  gold_traces/baseline/appmaps/**/*.appmap.json binary
  ```
- git-ignore the `.appmap/` directory, which is used as a temporary working directory by the gold traces tools.
- Ensure that the [AppMap CLI](/docs/reference/appmap-client-cli) is available.

### Curate and commit the initial baseline

Next, the `appmap-gold-traces` skill is used to populate an initial set of gold traces. The skill analyzes the code repository to identify key features and functional code paths. It also inspects the test cases to learn what candidate tests are available that might be selected as gold traces. Then `gold_traces/manifest.yaml` is created, which lists the test cases that have been selected as gold traces.

The selected gold trace tests are run to create AppMap trace files. These files are sanitized using the CLI [`sanitize`](/docs/reference/appmap-client-cli#sanitize) command, and then they are copied into `gold_traces/baseline/appmaps/`. The configuration and the trace files are committed to git.

## Local workflow

The local development workflow relies entirely on the system components that are installed on the developer's machine. Because this runs locally before a pull request is submitted, this workflow will never block a shared build or affect other developers.

When performing local updates, the developer follows this procedural flow:

- Perform gold trace updates using the `appmap-gold-traces` skill.
- Create a code review using the `appmap-review` skill (or a customized code review skill).
- Inspect the generated review.
- Make code changes as appropriate; and iterate.
- Commit the code and gold traces (use of separate commits is recommended).
- Open a pull request that includes both the source code changes and the updated gold traces.

### Updating gold traces

When code changes are made, there are two tasks that should be performed to maintain the gold traces:

1. Selecting new gold traces to ensure that the new features and functionality are covered and represented.
2. Updating gold traces to reflect changes in runtime code behavior.

The `appmap-gold-traces` skill can perform both of these tasks. Any time code has changed, the gold trace test cases are re-recorded and compared with the existing traces. The comparison uses a robust, digest-based algorithm provided by the AppMap CLI: the digest ignores trivial variation in the data, such as the specific elapsed time of function calls or the specific captured values, so a reported change is a real change in runtime behavior. A trace that changes with no corresponding code change is nondeterministic — fix the test, rather than committing the noise (see [Deterministic](#deterministic)).

### Reviewing a change

With the gold traces data versioned in the repository, it can be used to compare the runtime behavior of any two branches or commits. The `appmap-review` skill performs this function. It proceeds in the following way:

1. Obtain the gold traces for the head revision from git.
2. Obtain the gold traces for the base revision from git.
3. Use AppMap CLI commands to process the gold traces for each revision, normalizing and computing derived data (see [`archive`](/docs/reference/appmap-client-cli#archive)).
4. Use the AppMap CLI to compute a diff of the runtime behavior of the two revisions (see [`compare`](/docs/reference/appmap-client-cli#compare)).
5. Reconcile the runtime behavior changes with an analysis of the code diff, to produce a code review report.

Security analysis can be assisted further by applying [AppMap labels](/docs/reference/analysis-labels) to the code. When code behavior changes in ways that affect security — for example, introduction of, or absence of, a security-critical function invocation — this change can be robustly detected, analyzed, and reported.

## Running in CI

The centralized workflow runs on creation or update of pull requests. Because the code has already been pushed and a pull request is open, the CI workflow does not make code changes — it focuses on updating the gold traces, performing code review, and writing the code review findings back to the pull request.

The [review action](https://github.com/getappmap/review-action) packages this workflow as a GitHub Action. It runs an AI coding agent (Claude Code or GitHub Copilot CLI) executing the `appmap-gold-traces` and `appmap-review` skills:

1. Update the gold traces from the project's own test infrastructure, bootstrapping baselines if they are missing.
2. Commit and push the trace changes to the pull request's head branch.
3. Run the review, comparing the head traces against the base revision.
4. Post the resulting review directly on the pull request, as a sticky comment that updates in place on re-runs.

Unlike the developer-local workflow, the action automatically blesses and commits trace drift. The review report flags potential regressions, and developers can edit code and re-run to re-record.

For the action's reference documentation — prerequisites, inputs and outputs, workflow trigger patterns, and example workflow YAML — see the [review action repository](https://github.com/getappmap/review-action).

## Properties of a good gold trace

Gold traces must adhere to certain properties in order to be "good citizens" of the git repository. The `appmap-gold-traces` skill is instructed to follow these principles.

### Minimal spanning set

A minimal number of gold traces should be included that are sufficient to cover the functional aspects of the application.

### End-to-end

An ideal gold trace covers the application from initial invocation — e.g. via a web service route — through the application code, to the database, to external service calls, and back to the client. Test cases should include a minimal amount of mocking. The database must not be mocked, because SQL queries are a critical aspect of runtime data that must be available in the traces. HTTP routes should also be included in the traces, because the traces should provide a comprehensive view of the application API surface.

### Minimally sized

Each gold trace should be detailed enough to cover the runtime code behavior, but it should not be bloated with repeated calls to trivial functions. The `appmap.yml` file provides the capability to exclude specific functions from the AppMap trace files, and the `appmap-gold-traces` skill is instructed to maintain function exclusion rules in order to prevent trace files from being bloated. See [Refining AppMap Data](/docs/reference/guides/refine-appmap-data).

### Deterministic

The comparison only works if traces are reproducible. A nondeterministic trace — unseeded RNG, wall-clock branching, or ordering that varies run to run — drifts on every compare and trains you to ignore real changes. Seed RNG in the test, pin any time-dependent input, and stabilize collection ordering. If a trace drifts with no code change, fix the test before committing it.

### Sanitized

Gold trace files should not contain any data values that might be personally-identifiable information or secret in nature (e.g. API keys, database passwords, encryption keys). To ensure that gold trace files don't contain such data, each gold trace is processed by the AppMap CLI [`sanitize`](/docs/reference/appmap-client-cli#sanitize) command before it is committed to git, which replaces all captured parameter, return, and message strings with short synthetic tokens.

## Build pipeline and scanning

Gold trace files travel through the existing build and scanning pipeline as part of the repo, like any other file. Gold trace files are JSON data; they can be treated by the build pipeline very similarly to documentation files that are committed to the repo along with their corresponding code changes.

### Secret and PII scanning

AppMap trace files do not serve any operational purpose to a runtime application, so there is no need to include them in a built image. Because each trace is processed by the [`sanitize`](/docs/reference/appmap-client-cli#sanitize) command before commit, captured values are replaced with synthetic tokens before a secret scanner (e.g. Checkmarx) ever sees them. Any finding from a secret scanner should be investigated through the existing process.

### Test coverage scanning

AppMap trace files are data, not code, so no test case coverage is required. The `gold_traces/` directory can be excluded from coverage scanning (e.g. SonarQube) by path, in the same manner as documentation and test case directories.

### Dependency scanning

Trace files are JSON, not libraries, and are not scanned as dependencies. The AppMap language agents are only utilized in development, and should not be present on built images. If the libraries are accidentally placed on built images and flagged by a library scanner, they can be removed from the image; the libraries are open source, and therefore fully transparent to all users.

### Merge conflicts

Trace files are marked binary in `.gitattributes`, so git never tries to merge their contents line by line. If two branches make different changes to the same gold trace, git reports a conflict, like any other merge conflict. Resolve the underlying code conflict, then re-run the gold trace update on the combined code: the regenerated trace replaces both conflicting versions. A trace conflict is never resolved by selecting one side.

## Manifest reference

`gold_traces/manifest.yaml` is one file: the recording `commands` plus the curated `entries`.

| Field | Meaning |
|---|---|
| `commands.record` | Shell template to record one test, run from the `gold_traces` parent directory. Placeholders `{test_file}`, `{test_name}`, `{appmap_path}` are substituted per entry. |
| `commands.record_env` | Extra environment variables for the record command (e.g. a recorder enable flag). |
| `commands.appmap_cli` | AppMap CLI to run for sanitizing and comparison. Leave unset: it auto-discovers `~/.appmap/bin/appmap` (where the IDE extensions install it), else `appmap` on `PATH`. |
| `expand` *(optional)* | Package code-object ids to render at function granularity. Default empty — package granularity already catches function changes. |
| `allow_values` *(optional)* | Values `appmap sanitize` keeps verbatim in committed baselines, exact whole-value match. Curate small public vocabularies only (enum state/role names); never anything that could identify a person or authenticate a request. |
| `entries` | The curated list. Each entry: `feature`, `test_file`, `test_name`, `appmap_path`, `summary`. |

Paths are derived, not configured: commands run from the `gold_traces` parent directory, and recordings are read from the nearest-ancestor `appmap.yml` (its directory plus its `appmap_dir`). Place `gold_traces/` inside the directory you want commands to run from, within an AppMap project.

## GitHub repositories

- [getappmap/skills](https://github.com/getappmap/skills) — the AppMap skills and their full specifications
- [getappmap/review-action](https://github.com/getappmap/review-action) — the behavioral review GitHub Action
- [getappmap/appmap-js](https://github.com/getappmap/appmap-js) — the AppMap CLI and JavaScript tooling

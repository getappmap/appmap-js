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
- [Installing the skills](#installing-the-skills)
- [Storage in the repository](#storage-in-the-repository)
  - [Multi-module projects](#multi-module-projects)
- [Setup](#setup)
  - [Set up recording](#set-up-recording)
  - [Curate and commit the initial baseline](#curate-and-commit-the-initial-baseline)
  - [Trying it on an existing change](#trying-it-on-an-existing-change)
- [Local workflow](#local-workflow)
  - [Updating gold traces](#updating-gold-traces)
  - [Reviewing a change](#reviewing-a-change)
  - [Reviewing without gold traces](#reviewing-without-gold-traces)
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

AppMap gold traces are curated, minimally sized recordings of an application's runtime behavior — capturing function calls, HTTP routes, and SQL queries — driven by a representative subset of the project's integration tests. Gold traces are sanitized and committed in git alongside the application code. This pure git workflow allows developers to explicitly track and inherit changes to application paths across different branches and commits. The provenance of each gold trace is managed by git.

By comparing gold traces from a base revision to a head revision, and correlating these changes to the source code diff, development teams can obtain deep insight into runtime code changes. These include security-impacting changes, API changes and drift, SQL query impact analysis, unexpected side effects of code changes, and more.

People do not read the trace files. The trace files are data for the tools. People read what the tools produce from them: a summarized, interpreted review of the behavior changes, backed by the traces and supported by AppMap diagrams, which are human-readable.

## Concepts

### Gold traces

Gold traces are traces that are selected to provide representative coverage of the key application code paths. Gold traces are selected from a curated subset of the project's integration tests. At least one representative trace should be included per release-critical subsystem, with additional traces for materially different execution paths.

### The manifest

The file `gold_traces/manifest.yaml` lists the test cases that have been selected as gold traces, along with the commands used to record them. The `appmap-setup` skill writes the commands, and the `appmap-gold-traces` skill curates the list of test cases. See the [Manifest reference](#manifest-reference) for the file format.

## Prerequisites

- **A project with working integration tests** — the project builds, and its integration tests run. Gold traces are recorded from integration tests: tests that drive the application through several layers, such as an HTTP request that runs application code and queries the database. Unit tests are not enough. A unit test covers only a class or two, so its trace does not show useful runtime behavior.
- **git** — git provides storage and management of the AppMap trace data. No shared AppMap service or separate trace store is required.
- **Node.js** — the skills run their helper scripts with `node`.
- **AI coding agent and the AppMap skills** — a coding agent (such as Claude Code or GitHub Copilot CLI) with the AppMap skills installed. See [Installing the skills](#installing-the-skills). The gold traces capability can be utilized without the AI agent skills, but using an agent with the skills makes the process much more streamlined and efficient.

AppMap recording does not need to be configured in advance. The `appmap-setup` skill checks for the AppMap tools, installs what is missing, and configures the project to record. See [Setup](#setup).

## Installing the skills

The skills are provided in the open source repository [getappmap/skills](https://github.com/getappmap/skills):

| Skill | What it does |
|---|---|
| `appmap-setup` | Gets a repository recording AppMap Data, and writes the record commands into `gold_traces/manifest.yaml`. |
| `appmap-gold-traces` | Selects the gold trace tests, records them, and keeps the committed baseline up to date. |
| `appmap-review` | Compares the runtime behavior of two revisions and writes a code review. |
| `appmap-record` | Records AppMap Data from tests, HTTP requests, or a running process. Used by the other skills. |
| `appmap-config` | Configures what is recorded: `appmap.yml` and function labels. Used by the other skills. |
| `appmap-setup-review` | Demonstrates a gold traces review on a change that is already in the git history. |

The simplest way to install the skills is to ask the coding agent to do it. Paste this prompt into the agent:

```
Install the AppMap skills from the latest published release of
https://github.com/getappmap/skills.

1. Find the tag of the latest release, for example v1.6.0:
   https://github.com/getappmap/skills/releases/latest
2. Check whether that release is already installed. The skills are kept in
   ~/.appmap/skills, and the file ~/.appmap/skills/.version holds the
   installed version, without the leading "v" (for example 1.6.0). If it
   matches the latest release, and every appmap-* directory there is
   available as a skill for this agent, stop here and tell me the skills
   are up to date.
3. Otherwise, download the source code archive of that release. Do not use
   git clone, and do not use the main branch.
     https://github.com/getappmap/skills/archive/refs/tags/<tag>.tar.gz
     https://github.com/getappmap/skills/archive/refs/tags/<tag>.zip
4. Replace the contents of ~/.appmap/skills with the contents of the
   archive, so that the appmap-* directories sit directly inside
   ~/.appmap/skills. The archive has one top-level directory; leave that
   level out. Remove the old appmap-* directories first, so that no files
   from the previous release are left behind.
5. Write the new version to ~/.appmap/skills/.version, without the leading
   "v".
6. Make each appmap-* directory in ~/.appmap/skills available as a skill for
   this agent. For Claude Code, symlink each one into ~/.claude/skills/. Do
   not replace anything at that path that is not already a symlink into
   ~/.appmap/skills.
7. Tell me which release is installed, and list the skills.
```

The skills are installed from the source code archive of a [published release](https://github.com/getappmap/skills/releases), not from the latest code on the main branch. Start a new agent session afterward, so that the agent loads the new skills.

To update the skills later, paste the same prompt again. It makes no changes when the latest release is already installed.

## Storage in the repository

Gold traces are stored and managed in the `gold_traces/` directory:

- `gold_traces/manifest.yaml` — the manifest: record commands plus the curated entries.
- `gold_traces/baseline/appmaps/` — the committed, sanitized baseline recordings.

Gold trace files are committed in git along with the code. They are flagged as binary data in `.gitattributes`, so that git does not try to merge them. The `appmap-gold-traces` skill adds this setting.

Everything derived from the baselines — sequence diagrams, archives, the review — is produced on demand under the `.appmap/` directory, which is gitignored and never committed. The raw recordings that the tests produce (by default under `tmp/appmap/`) are gitignored as well. Only the sanitized copies in `gold_traces/baseline/appmaps/` are committed.

Gold trace files flow through git branches according to the branch strategy that's established for the project. Each branch carries the trace set committed with that branch. Checking out a branch, commit, or release tag retrieves the code and the trace set stored at that revision. Gold traces adopt the organization's existing branching strategy; they add no branches or rules of their own.

Similar to documentation, gold traces may be updated continuously as the developer works, or may be updated in larger batches when code integration is performed. As with most development tasks, small batches work best.

### Multi-module projects

For multi-module projects, each sub-module may have its own `gold_traces/` directory: one for each `appmap.yml` file in the project. A `gold_traces/` directory per module keeps traces versioned and reviewed alongside the code they guard, and lets modules be recorded and blessed independently. A single repo-root directory is fine when the repo is effectively one project.

## Setup

A one-time setup process is required to configure a repository for gold traces. Once performed, this configuration is committed to the repo, and does not need to be performed again in the future. Setup has two steps, and each step is performed by a skill:

| Step | Skill | Result |
|---|---|---|
| 1. Set up recording | `appmap-setup` | The project records AppMap Data, and the record commands are saved. |
| 2. Curate the initial baseline | `appmap-gold-traces` | The first set of gold traces is committed. |

Both steps assume the [Prerequisites](#prerequisites) are in place.

### Set up recording

Start the coding agent in the repository, and run the `appmap-setup` skill. In the agent chat, type the skill name with a leading forward slash:

```
/appmap-setup
```

The skill needs no arguments. To give it a hint, add it after the skill name:

```
/appmap-setup The integration tests are in the integration-tests module and need the Postgres container from docker-compose.yml.
```

The skill:

- Checks that the AppMap tools are available, and installs what is missing.
- Confirms that the project builds and its tests run.
- Configures AppMap recording, then records one unit test and one integration test to prove that it works. The unit test is only a quick check of the configuration. The gold traces themselves come from integration tests.
- Removes noisy classes and functions from the recordings, so that the trace files stay small.
- Writes the working record commands into `gold_traces/manifest.yaml`, so that every later session records in the same way.

The skill commits its work in three separate commits: the recording configuration, the noise exclusions, and the record commands. The files and directories that it creates are described in [Storage in the repository](#storage-in-the-repository).

### Curate and commit the initial baseline

Next, the `appmap-gold-traces` skill is used to populate an initial set of gold traces. The skill analyzes the code repository to identify key features and functional code paths. It also inspects the integration tests to learn what candidate tests are available that might be selected as gold traces. The selected test cases are added to `gold_traces/manifest.yaml`, which already contains the record commands from the previous step.

```
/appmap-gold-traces Create the initial set of gold traces.
```

The selected gold trace tests are run to create AppMap trace files. Each test is recorded twice, and a test whose trace differs between the two runs is rejected (see [Deterministic](#deterministic)). The trace files are sanitized using the CLI [`sanitize`](/docs/reference/appmap-client-cli#sanitize) command, and then they are copied into `gold_traces/baseline/appmaps/`. The manifest and the trace files are committed to git.

### Trying it on an existing change

The `appmap-setup-review` skill demonstrates gold traces on a change that is already in the git history. It is intended for evaluation, not for day-to-day use.

```
/appmap-setup-review
```

The skill:

1. Chooses two commits that are one feature apart: a base and a head.
2. Runs `appmap-setup` on the base commit, and commits an initial set of gold traces there.
3. Replays the same setup onto the head commit, and updates the gold traces for the feature.
4. Runs `appmap-review` to compare the two.

The result shows what a gold traces review would have reported about that change. The work is done on two new branches, `appmap-base` and `appmap-head`, so existing branches are not modified.

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

The `appmap-gold-traces` skill can perform both of these tasks:

```
/appmap-gold-traces Update the gold traces for the changes on this branch.
```

Any time code has changed, the gold trace test cases are re-recorded and compared with the existing traces. The comparison uses a robust, digest-based algorithm provided by the AppMap CLI: the digest ignores trivial variation in the data, such as the specific elapsed time of function calls or the specific captured values, so a reported change is a real change in runtime behavior. A trace that changes with no corresponding code change is nondeterministic — fix the test, rather than committing the noise (see [Deterministic](#deterministic)).

### Reviewing a change

With the gold traces data versioned in the repository, it can be used to compare the runtime behavior of any two branches or commits. The `appmap-review` skill performs this function. It takes one or two git revisions (a commit SHA, branch, or tag):

```
/appmap-review <baseline-rev> [<head-rev>]
```

For example, to review the current branch against `main`:

```
/appmap-review main
```

When only the baseline revision is given, the head is the current `HEAD`. The head can also be the working tree, to review a change before it is committed. The baseline always comes from git.

The skill proceeds in the following way:

1. Obtain the gold traces for the head revision from git.
2. Obtain the gold traces for the base revision from git.
3. Use AppMap CLI commands to process the gold traces for each revision, normalizing and computing derived data (see [`archive`](/docs/reference/appmap-client-cli#archive)).
4. Use the AppMap CLI to compute a diff of the runtime behavior of the two revisions (see [`compare`](/docs/reference/appmap-client-cli#compare)).
5. Reconcile the runtime behavior changes with an analysis of the code diff, to produce a code review report.

Security analysis can be assisted further by applying [AppMap labels](/docs/reference/analysis-labels) to the code. When code behavior changes in ways that affect security — for example, introduction of, or absence of, a security-critical function invocation — this change can be robustly detected, analyzed, and reported. The review report suggests labels to add, and the `appmap-config` skill applies them.

### Reviewing without gold traces

The `appmap-review` skill can also compare two recordings that were made by hand, with no gold traces in the repository. Record the same scenario once on the base branch and once on the head branch — for example, by running the same requests against a server with [remote recording](/docs/get-started-with-appmap/making-appmap-data) enabled. Then ask the skill to review the two recording files:

```
/appmap-review Compare these two recordings of the checkout scenario: tmp/checkout-main.appmap.json (base) and tmp/checkout-feature.appmap.json (head).
```

Two things are different in this mode. The recordings are not sanitized, so they contain real data values; take care not to share secrets or personal data from them. And the review covers only the one scenario that was recorded, so a clean result does not clear the rest of the application.

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

An ideal gold trace covers the application from initial invocation — e.g. via a web service route — through the application code, to the database, to external service calls, and back to the client. This is why gold traces come from integration tests, not unit tests. Test cases should include a minimal amount of mocking. The database must not be mocked, because SQL queries are a critical aspect of runtime data that must be available in the traces. HTTP routes should also be included in the traces, because the traces should provide a comprehensive view of the application API surface.

### Minimally sized

Each gold trace should be detailed enough to cover the runtime code behavior, but it should not be bloated with repeated calls to trivial functions. The `appmap.yml` file provides the capability to exclude specific functions from the AppMap trace files. The `appmap-setup` skill adds the first exclusion rules, and the `appmap-gold-traces` skill is instructed to maintain them in order to prevent trace files from being bloated. The exclusion syntax for each language is described by the `appmap-config` skill. See [Refining AppMap Data](/docs/reference/guides/refine-appmap-data).

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
| `schema_version` | The manifest format version. The current version is `2`. An older manifest still works, and the skill prints a note asking for it to be upgraded. |
| `commands.framework` | The test framework: `pytest`, `unittest`, `rspec`, `minitest`, `rails-test`, `jest`, `vitest`, `mocha`, `maven`, or `gradle`. The record commands are built from this name, and the gold trace tests are recorded in as few test runs as the framework allows. Cannot be combined with `commands.record`. |
| `commands.runner` *(optional)* | Replaces the launcher: the part of the command that comes before the test names (for example `npx appmap-node yarn jest`, or `./mvnw -Pintegration test`). When unset, the launcher is detected from the project — for example a Python virtualenv, or a Maven or Gradle wrapper script. |
| `commands.args` *(optional)* | Flags added after the test names (for example `-q`). |
| `commands.batch_size` *(optional)* | The most tests that may share one test run. Leave unset unless runs need to be kept small on purpose, for example to isolate a flaky test. |
| `commands.record` | For a test runner that is not in the `framework` list: a shell template to record one test, run from the `gold_traces` parent directory, once per entry. Placeholders `{test_file}` and `{test_name}` are substituted per entry. Cannot be combined with `commands.framework`. |
| `commands.record_env` | Extra environment variables for the record command (e.g. a recorder enable flag). |
| `commands.appmap_cli` | AppMap CLI to run for sanitizing and comparison. Leave unset: it auto-discovers `~/.appmap/bin/appmap` (where the IDE extensions install it), else `appmap` on `PATH`. |
| `expand` *(optional)* | Package code-object ids to render at function granularity. Default empty — package granularity already catches function changes. |
| `allow_values` *(optional)* | Values `appmap sanitize` keeps verbatim in committed baselines, exact whole-value match. Curate small public vocabularies only (enum state/role names); never anything that could identify a person or authenticate a request. |
| `entries` | The curated list. Each entry: `feature`, `test_file`, `test_name`, `appmap_path`, `summary`. The `appmap_path` is the path of the recording relative to the project's `appmap_dir`; the `appmap-gold-traces` skill finds it by recording the test. The `expect` and `expect_labels` fields of older manifests are no longer used, and can be deleted. |

Paths are derived, not configured: commands run from the `gold_traces` parent directory, and recordings are read from the nearest-ancestor `appmap.yml` (its directory plus its `appmap_dir`). Place `gold_traces/` inside the directory you want commands to run from, within an AppMap project.

## GitHub repositories

- [getappmap/skills](https://github.com/getappmap/skills) — the AppMap skills and their full specifications
- [getappmap/review-action](https://github.com/getappmap/review-action) — the behavioral review GitHub Action
- [getappmap/appmap-js](https://github.com/getappmap/appmap-js) — the AppMap CLI and JavaScript tooling

---
layout: docs
title: Docs - Reference
description: "Learn how to use AppMap GitHub Actions to analyze code changes efficiently. Setup and configure AppMap tools, archive, and analyze AppMap Data for each pull request."
reference: true
toc: true
name: GitHub Action
step: 16
---

# GitHub Action Reference <!-- omit in toc -->

- [Actions Reference](#actions-reference)
  - [Install AppMap Tools](#install-appmap-tools)
  - [Archive AppMap Data](#archive-appmap-data)
  - [Analyze AppMap Data](#analyze-appmap-data)
- [Reusable Workflows](#reusable-workflows)
- [Permissions](#permissions)


<p class="alert alert-info">
To get started with the AppMap GitHub Action,  <a href="/docs/integrations/github-actions">refer to the setup documentation</a>
</p>

## Actions Reference

AppMap uses 3 separate GitHub Actions to analyze your code on each pull request. Find the reference documentation below for each of these actions. 

### Install AppMap Tools
[getappmap/install-action](https://github.com/getappmap/install-action)
Prepares a repository to record AppMap Data and to run AppMap CLI commands. 

This Action will run on commits to the main branch and whenever pull requests are created. The Action will install the AppMap binary into the GitHub Action environment in the `/usr/local/bin/` directory.

[Configuration Options](https://github.com/getappmap/install-action/blob/main/action.yml)

### Archive AppMap Data
[getappmap/archive-action](https://github.com/getappmap/archive-action)
Archives AppMap Data built in the current project. 

This Action runs when a new branch or Pull Request is merged to the main branch. It will generate a `.tar.gz` archive of the AppMap Data created by your test cases and store it as a GitHub artifact. The stored file includes the archive JSON and the AppMap Data archive.

[Configuration Options](https://github.com/getappmap/archive-action/blob/main/action.yml)

### Analyze AppMap Data
[getappmap/analyze-action](https://github.com/getappmap/analyze-action)

This Action runs when a Pull Request (or draft) is opened, reopened, or a new commit is added. This Action generates the AppMap analysis report for the head revision, compared to the base branch. A report in Markdown format is generated and is stored as a GitHub artifact within the GitHub Action. This report can optionally be pushed to the active Pull Request as a comment.

[Configuration Options](https://github.com/getappmap/analyze-action/blob/main/action.yml)

## Reusable Workflows

GitHub supports calling a [reusable workflow](https://docs.github.com/en/actions/using-workflows/reusing-workflows) in another project to simplify configuration.  AppMap provides two reusable workflows for single runner and full matrix builds.

For single runner builds: [appmap-analysis.yml@v1](https://github.com/getappmap/analyze-action/blob/v1/.github/workflows/appmap-analysis.yml)

**Inputs**
```yaml
inputs:
  archive-retention-days:
    required: false
    type: number
    default: 7
  runner-name:
    required: false
    type: string
    default: ubuntu-latest
  directory:
    required: false
    type: string
    default: .
```
{: .example-code}

For example you can customize your runner with:
```yaml
appmap-analysis:
  if: always()
  needs: [record-appmaps]
  uses: getappmap/analyze-action/.github/workflows/appmap-analysis.yml@v1
  with:
    runner-name: My-Custom-4-Core-Runner
  permissions:
      actions: read
      contents: read
      checks: write
      pull-requests: write
```
{: .example-code}

[appmap-analysis-matrix.yml@v1](https://github.com/getappmap/analyze-action/blob/v1/.github/workflows/appmap-analysis-matrix.yml)

```yaml
inputs:
  archive-retention-days:
    required: false
    type: number
    default: 7
  archive-count:
    required: true
    type: number
  runner-name:
    required: false
    type: string
    default: ubuntu-latest
  directory:
    required: false
    type: string
    default: .
```
{: .example-code}

The matrix runner supports a custom runner name and requires an `archive-count` which needs to be equal to the total number of runners in your matrix build. 

**Example:** `4` or `15`

**Example inside reusable workflow.**
```yaml
appmap-analysis:
  if: always()
  needs: [record-appmaps]
  uses: getappmap/analyze-action/.github/workflows/appmap-analysis-matrix.yml@v1
  with:
    archive-count: 2
  permissions:
      actions: read
      contents: read
      checks: write
      pull-requests: write
```
{: .example-code}

Multiple options can be passed to the reusable workflows.

```yaml
appmap-analysis:
  if: always()
  needs: [record-appmaps]
  uses: getappmap/analyze-action/.github/workflows/appmap-analysis-matrix.yml@v1
  with:
    archive-count: 2
    runner-name: My-Custom-4-Core-Runner
  permissions:
      actions: read
      contents: read
      checks: write
      pull-requests: write
```
{: .example-code}

## Permissions

```yaml
permissions:
  actions: read
  contents: write
  checks: write
  pull-requests: write
```
{: .example-code}

Configures the permissions granted to the `$GITHUB_TOKEN`. This is the minimum required level of permissions that will allow the GitHub Action to execute. Refer to the [GitHub documentation](https://docs.github.com/en/actions/using-jobs/assigning-permissions-to-jobs) for more details about Action permission levels.

`actions: read` Grants the GitHub Action permission to interact with the artifacts and caches of the job to read the baseline artifact and perform the AppMap comparison.

`contents: write` Grants the Action permission to commit the AppMap library and configuration file to the project during installation. Also grants permission to read the artifacts created by the GitHub Action, such as the AppMap archive tarballs. This is used to fetch the "base" and "head" archive data for comparing changes between a mainline branch and changes in a Pull Request.

`checks: write` Allows the Action to annotate code inline in a Pull Request workflow.

`pull-requests: write` Grants the Action permission to comment on the Pull Request with a detailed report of code behavior changes.
---
layout: docs
title: Set up AppMap in CI
description: "Optimize GitHub Actions for matrix builds to deploy AppMap efficiently. Modify actions, add triggers, analyze results, and streamline installation configurations."
name: Matrix Builds with GitHub Actions
setup-appmap-ci: true
step: 5
render_with_liquid: false
---

## Matrix Builds with GitHub Actions

- [Step 1: Modify Action to Support Matrix Build](#step-1-modify-action-to-support-matrix-build)
- [Step 2: Add the Build Triggers and Analysis Step](#step-2-add-the-build-triggers-and-analysis-step)
- [(Optional) Step 3: Remove Installation Actions and Configuration](#optional-step-3-remove-installation-actions-and-configuration)
- [Step 4: Merge this PR to deploy AppMap](#step-4-merge-this-pr-to-deploy-appmap)


If your project uses matrix builds in order to split your test runs across multiple runners, you will need some additional configuration for AppMap to properly save and merge AppMaps from across all these runs. 

From the [GitHub documents](https://docs.github.com/en/actions/using-jobs/using-a-matrix-for-your-jobs) on the `matrix strategies`:

> A matrix strategy lets you use variables in a single job definition to automatically create multiple job runs that are based on the combinations of the variables. For example, you can use a matrix strategy to test your code in multiple versions of a language or on multiple operating systems.
> Use `jobs.<job_id>.strategy.matrix` to define a matrix of different job configurations. Within your matrix, define one or more variables followed by an array of values.

For example, to split tests across two runners you could set a matrix strategy like the following:

```yaml
strategy:
  fail-fast: false
  matrix:
    ci_node_total: [2]
    ci_node_index: [0, 1]
```
{: .example-code}

For AppMap to analyze any failed test cases, you need to include the configuration flag `fail-fast: false` in your matrix strategy. 

### Step 1: Modify Action to Support Matrix Build

When following the Getting Started Guide In [Step 1](/docs/setup-appmap-in-ci/in-github-actions.html#step-1-create-an-initial-baseline-appmap-inventory-report), you'll need to make a few changes and additions to your GitHub Workflow file before you commit the first step.

First, modify the `EndBug/add-and-commit` action to include an if statement so that only one of the runners will commit the AppMap library installation files to the project. 

For Example:
```yaml
- name: Commit changes
  if: ${{ matrix.ci_node_index == 0}} #Only run this action on a single runner
  uses: EndBug/add-and-commit@v9
```
{: .example-code}

Next, you'll modify the `archive-action` to configure an `archive-id:` set to the unique index of the runner. This will archive each tarball of AppMaps from each runner in your Action.

For example:
```yaml
- name: Archive AppMaps
  if: always()
  uses: getappmap/archive-action@v1
  with:
    archive-id: ${{ matrix.ci_node_index }} # Set this equal to the unique index of the runner
```
{: .example-code}

After the action which runs your test cases, you will create a new job that will merge the AppMaps from your individual runners, archive them, and provide the initial AppMap inventory report.

Create a new job at the same level as the job which runs the test cases, and make this job dependant on the previous job.

For example:
```yaml
merge-and-archive:
  runs-on: ubuntu-latest
  if: always()
  needs: [test]

  steps:
    - name: Checkout
      uses: actions/checkout@v3
      with:
        ref: ${{ github.event.pull_request.head.ref }}

    - name: Install AppMap tools
      uses: getappmap/install-action@v1
      with:
        install-appmap-library: false

    - name: Merge AppMaps
      uses: getappmap/archive-action/merge@v1
      with:
        revision: ${{ github.event.pull_request.base.sha }}
        archive-count: 2 # Set this equal to the total number of test runners (i.e. total archives created)
```
{: .example-code}

Commit the changes:

```bash
$ git add .
$ git commit -m "ci: Bootstrap initial AppMap archive"
```
{: .example-code}

View an example workflow [file for this step here](https://github.com/land-of-apps/sample_rails_matrix_build/blob/5825614c9c7530c2108b14b030be1efcd2d40fec/.github/workflows/appmap-analysis.yml).

Push the changes upstream to your branch and open a new Pull Request which will trigger the GitHub action. Once the build of this PR completes, AppMap will comment on the PR with an initial report about your software project.

<img class="video-screenshot" src="/assets/img/docs/gh-action/action-welcome-to-appmap.webp"/> 

The initial AppMap report will give you details about:

- **Runtime Analysis:** Analyzing the AppMap data for security flaws and anti-patterns  
- **REST API analysis** For AppMaps that include HTTP server requests, AppMap can automatically generate OpenAPI definitions.
- **SQL Profile**  When your code makes a SQL query, AppMap records the SQL query in detail. It even parses the queries
to figure out which tables your app is using, and how it's using them.

### Step 2: Add the Build Triggers and Analysis Step

With the previous step complete, and a inventory report in your pull request, you can now replace the `merge-and-archive` job we used in the last step and replace it with the `appmap-analysis-matrix` reusable workflow with an additional configuration option `archive-count`.

The `archive-count` is the total number of test runners which have generated AppMap archives. For example, if you have split your test runner across 2 hosts, you need to set the `archive-count` equal to `2`.

For example:
```yaml
appmap-analysis:
  if: always()
  needs: [test]
  uses: getappmap/analyze-action/.github/workflows/appmap-analysis-matrix.yml@v1
  with:
    archive-count: 2 # Set to the total number of test runners
  permissions:
    actions: read
    contents: read
    checks: write
    pull-requests: write
```
{: .example-code}

Pull the latest commit made by the previous GitHub Action workflow run

```bash
$ git pull
```
{: .example-code}

Commit the changes:

```bash
$ git add .
$ git commit -m "ci: Add build triggers and analysis step"
```
{: .example-code}

Push the changes upstream to your branch.
```bash
$ git push
```
{: .example-code}

After the build completes, AppMap will post details of the Analysis build into your pull request. 

<img class="video-screenshot" src="/assets/img/docs/gh-action/action-report-summary.webp"/> 

View an example workflow [file for this step here](https://github.com/land-of-apps/sample_rails_matrix_build/blob/03d10c03430c84b05542eeca9408c46297dfd97c/.github/workflows/appmap-analysis.yml).

If your pull request report shows changes to code behavior or new AppMaps (when no changes are made), you may have some non-deterministic tests. For additional help resolving this, please contact the AppMap engineering team via [email](mailto:support@appmap.io) or join the [AppMap Community Slack](https://appmap.io/slack).

### (Optional) Step 3: Remove Installation Actions and Configuration

Now that AppMap configuration files are included in your project, you no longer need the `permissions` block at the top of your action (unless required for other actions) and `add-and-commit` actions in your project. Additionally, modify the `install-action` to disable library installation. The Action will require the AppMap CLI tools installed to successfully archive the AppMaps from each runner. If they are left in place your project will always update to the latest released versions of AppMap libraries. Remove the following lines to have more control over future software updates.

This action can be deleted.

```yaml
- name: Commit changes
  if: ${{ matrix.ci_node_index == 0}}
  uses: EndBug/add-and-commit@v9  
```
{: .example-code}

Unless needed for other Actions in your workflow, modify this section with updated permissions from Step 1:

```yaml
permissions:
  contents: write
```
{: .example-code}


Modify the `install-action` with the following setting:

```yaml
- name: Install AppMap tools
  uses: getappmap/install-action@v1
  with:
    install-appmap-library: false
```
{: .example-code}

Finally, you can set your `checkout` action back to the default.
```yaml
- name: Checkout
  uses: actions/checkout@v3
```
{: .example-code}

After removing those Actions, add and commit to your branch.

```bash
$ git add .
$ git commit -m "ci: Remove installation actions"
```
{: .example-code}

Push the changes upstream to your branch.
```bash
$ git push
```
{: .example-code}

<p class="alert alert-info">
See an example GitHub Action configuration with AppMap working with a <a href="https://github.com/land-of-apps/sample_rails_matrix_build/blob/appmap/.github/workflows/appmap-analysis.yml" target="_blank">multi-runner matrix build</a>.
</p>

### Step 4: Merge this PR to deploy AppMap
Congratulations! You’ve successfully set up the AppMap Github Action and can now merge this into your project to make it available for every other developer to use on each of their subsequent pull requests. 
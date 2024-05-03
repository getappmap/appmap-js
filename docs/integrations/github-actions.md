---
layout: docs
title: Docs - Integrations
description: "Use AppMap Analysis within GitHub Actions to analyze behavioral changes per Pull Request. It offers root cause analysis, API changes tracking, security and performance findings, and more."
integrations: true
name: GitHub Actions
step: 2
redirect_from: [/docs/setup-appmap-in-ci, /docs/setup-appmap-in-ci/how-it-works, /docs/setup-appmap-in-ci/in-github-actions, /docs/setup-appmap-in-ci/example-projects, /docs/setup-appmap-in-ci/matrix-builds, /docs/setup-appmap-in-ci/troubleshooting]
render_with_liquid: false
---

# GitHub Actions <!-- omit in toc -->

<p class="alert alert-info">
If at any point you would like some help, <a href="/slack">join us in Slack</a>!
You'll find the AppMap team there, along with other AppMap users.
</p>

<a class="btn btn-primary btn-lg" href="https://github.com/marketplace/get-appmap">Get Started with our GitHub integration</a>

AppMap Analysis can work within GitHub Actions to collect, store, analyze, and report on the behavioral changes within each Pull Request. AppMap will analyze the changes in your application on each pushed commit or pull request. AppMap performs a thorough analysis of the runtime differences, giving you:

Root cause analysis of failed tests.
Web service API changes, both breaking and non-breaking.
New and resolved security findings.
New and resolved performance findings.
New and resolved findings in other categories: maintainability, reliability, and user-defined rules.
“Behavioral diffs” as sequence diagrams showing changed runtime behavior within the PR.

- [How it Works](#how-it-works)
- [Getting Started](#getting-started)
- [Example Projects](#example-projects) 
- [Matrix Builds](#matrix-builds)
- [Troubleshooting](#troubleshooting)

# How it Works

AppMap Analysis can work with your Continuous Integration (CI) system to collect, store, analyze, and report on the behavioral changes within each Pull Request. 
AppMap will analyze the changes in your application on each pushed commit or pull request. AppMap performs a thorough analysis of the runtime differences, giving you:

* Root cause analysis of failed tests.  
* Web service API changes - breaking and non-breaking - via comparison of generated OpenAPI definitions.  
* New and resolved security findings.  
* New and resolved performance findings.  
* New and resolved findings in other categories - maintainability, reliability, and user-defined rules.  
* “Behavioral diffs” as sequence diagrams showing changed runtime behavior within the PR.  

<p class="alert alert-info">
Install the <a href="https://github.com/marketplace/get-appmap" target="_blank">AppMap GitHub App</a> on the GitHub Marketplace to get started now!
</p>

The AppMap Analysis GitHub actions can run cooperatively or independently of your existing CI job. 
For example, AppMap Analysis can run as a GitHub Action even if you do not use GitHub Actions as your CI system.

AppMap Analysis runs entirely within your existing GitHub account and does not send code or data to an external or 3rd-party server. For more information, refer to the [AppMap Security FAQ](https://appmap.io/security).

Once you create a pull request, AppMap Data is recorded as your test cases run. As AppMap Data is generated, an AppMap archive file is created that includes all the AppMap Data, plus some metadata about the job. As code is pushed to a branch, AppMap Analysis create an archive file for that code revision. This archive file is automatically saved as a CI artifact.  Once an archive has been created, it can be compared to the “base” revision (i.e. your mainline or production branch).  
1
## The value of AppMap in CI

We designed AppMap’s findings as a comment in the PR itself to enable the Development, QA, Architecture, and Security teams to review code faster, evaluate code independently, and catch deep-rooted code issues easier. This helps you determine the stability of new code in the context of where the code actually lives and allows for faster and more reliable code delivery. 

By simply browsing the PR comments, a DevOps team can reliably deploy code with the assurance that it meets all needed code quality requirements, reducing the amount of unnecessary communication between teams just to get the code live long before it is ever pushed to production.

## Requirements
If you have already generated AppMap Data outside of CI (for example, by running your test cases locally), you can quickly deploy AppMap in CI using the same commands used to execute your test cases. If you already have an existing CI job that builds an environment to execute your test cases, AppMap Analysis can be added to that job.

# Getting Started

<p class="alert alert-info">
If at any point you would like some help, <a href="/slack">join us in Slack</a>!
You'll find the AppMap team there, along with other AppMap users.
</p>

<p class="alert alert-success">
Make sure to <a href="https://github.com/marketplace/get-appmap">install the AppMap App from the GitHub Marketplace</a> before you start the installation process.
</p>

<a class="btn btn-primary btn-lg" href="https://getappmap.com/setup/">Install AppMap for GitHub Actions</a>

## Overview <!-- omit in toc -->
AppMap can work within GitHub Actions to collect, store, analyze, and report on the behavioral changes within each Pull Request. AppMap will analyze the changes in your application on each pushed commit or pull request. AppMap performs a thorough analysis of the runtime differences, giving you:

- Root cause analysis of failed tests.
- Web service API changes, both breaking and non-breaking.
- New and resolved security findings.
- New and resolved performance findings.
- New and resolved findings in other categories: maintainability, reliability, and user-defined rules.
- "Behavioral diffs" as sequence diagrams showing changed runtime behavior within the PR.

<img class="video-screenshot" src="/assets/img/docs/gh-action/analysis-github-action.webp"/> 

## Step-by-step walkthrough <!-- omit in toc -->

- [Step 1: Install the AppMap GitHub App from the GitHub Marketplace.](#step-1-install-the-appmap-github-app-from-the-github-marketplace)
- [Step 2: Choose an Installation Method](#step-2-choose-an-installation-method)
- [Step 3: Grant Access to your repositories.](#step-3-grant-access-to-your-repositories)
- [Step 4: Complete the Installation Process](#step-4-complete-the-installation-process)
- [Step 5: Merge this PR to deploy AppMap](#step-5-merge-this-pr-to-deploy-appmap)
- [Optional Post-Install Configuration](#optional-post-install-configuration)
  - [Configure Additional AppMap analysis rules](#configure-additional-appmap-analysis-rules)

Configuration of the AppMap GitHub Action happens inside a branch and can be easily tested in a Pull Request before merging any code changes to the mainline branch.  This allows users to easily test AppMap in the environment before deploying across the repository.  

Follow the steps below for your project. If you need additional assistance contact AppMap at [support@appmap.io](mailto:support@appmap.io) or join us in our [Community Slack](https://appmap.io/slack)

### Step 1: Install the AppMap GitHub App from the GitHub Marketplace.

<a class="btn btn-primary btn-lg" href="https://github.com/marketplace/get-appmap">Click to install the AppMap GitHub Action</a>

Installing the AppMap GitHub App into your repository will allow the AppMap installer to properly detect your repositories for installation. Your data is your data, AppMap does not store your code or any AppMap Data that is generated. For more details about AppMap security controls, review the [Security FAQ](https://appmap.io/security).

### Step 2: Choose an Installation Method

AppMap runs as a GitHub Action in your project. Add AppMap to a project with an existing GitHub workflow that runs tests successfully. Choose if you would like to install AppMap manually into your project or use the automated AI assisted installation.

<img class="video-screenshot" src="/assets/img/docs/gh-action/manual-or-ai-installer.webp"/> 

### Step 3: Grant Access to your repositories.
Granting AppMap access to your repositories allows AppMap to complete an automated installation for your project. For the automated installation to be successful you'll need an existing GitHub workflow which builds and tests your application successfully.  

<img class="video-screenshot" src="/assets/img/docs/gh-action/authorize-appmap.webp"/> 

*Note*: If you do not currently have a GitHub Action that can run your test cases, refer to the [GitHub documentation](https://docs.github.com/en/actions/quickstart) to build an Action that will execute your test cases.  

### Step 4: Complete the Installation Process

Follow the steps in the AppMap installation process to complete the AppMap Installation. AppMap will add a Configuration Report as a comment in the initial pull request. 

<img class="video-screenshot" src="/assets/img/docs/gh-action/config-report.webp"/> 

The initial AppMap report will give you details about:

- **AppMap Data sources** shows how many AppMap Diagrams were recorded, and which test frameworks were used.
- **Code profile** indicates which packages and modules were recorded.
- **Web service API profile** summarizes the HTTP requests observed while your tests ran. AppMap uses this information to automatically generate OpenAPI definitions.
- **SQL profile** summarizes the SQL queries executed in your tests.

After completing the initial configuration report, AppMap will analyze your entire source code repository. In this report AppMap will display recently introduced code flaws and problems. A sample of all the problems that were found in the AppMap Data are listed in order of when they were most likely introduced, with most recent first.

<img class="video-screenshot" src="/assets/img/docs/gh-action/appmap-project-summary.webp"/> 

### Step 5: Merge this PR to deploy AppMap
Congratulations! You’ve successfully set up the AppMap GitHub Action and can now merge this into your project to make it available for every other developer to use on each of their subsequent pull requests. 

 To see AppMap in action, create a draft pull request with some changes that you don't plan to merge. Some suggested changes include:

- Add a new test
- Add, change, or remove an API route
- Change how your application interacts with its database

AppMap will execute runtime code analysis on every pull request in this repository. 

<div class="video-container">
  <video playsinline loop autoplay muted>
    <source src="/assets/img/docs/gh-action/action-report-summary.mp4" type="video/mp4">
  </video>
</div>

## Optional Post-Install Configuration

### Configure Additional AppMap analysis rules 

AppMap comes with a comprehensive set of rules that are categorized by their impact on applications: Performance, Reliability, Maintainability, Stability, and Security.

You can refer to the [AppMap Documentation](/docs/reference/analysis-rules) for more information about all the rules that are available within AppMap.  

To enable additional rules simply add them to an `appmap-scanner.yml` file in the root of your project directory and commit it to your project. 

This is a sample `appmap-scanner.yml` file which you can use to enable or disable certain AppMap analysis rules. Rules can be disabled by commenting them out with the `#` character.

```yaml
checks:
  - rule: authz-before-authn
  # - rule: circular-dependency
  - rule: deprecated-crypto-algorithm
  - rule: deserialization-of-untrusted-data
  - rule: exec-of-untrusted-command
  - rule: http-500
  # - rule: illegal-package-dependency
  #   properties:
  #     callerPackages:
  #       - equal: actionpack
  #     calleePackage:
  #       equal: app/controllers
  # - rule: incompatible-http-client-request
  # - rule: insecure-compare
  # - rule: job-not-cancelled
  - rule: logout-without-session-reset
  # - rule: missing-authentication
  - rule: missing-content-type
  - rule: n-plus-one-query
  # - rule: query-from-invalid-package
  # - rule: query-from-view
  # - rule: rpc-without-circuit-breaker
  # - rule: save-without-validation
  - rule: secret-in-log
  # - rule: slow-function-call
  #   properties:
  #     timeAllowed: 0.2
  #     functions:
  #       - match: Controller#create$
  # - rule: slow-http-server-request
  #   properties:
  #     timeAllowed: 0.5
  # - rule: slow-query
  #   properties:
  #     timeAllowed: 0.05
  - rule: too-many-joins
  - rule: too-many-updates
  # - rule: unbatched-materialized-query
  - rule: unauthenticated-encryption
  - rule: update-in-get-request
```
{: .example-code}

Add these changes to Git and commit and put them into the PR branch.

```bash
$ git add .
$ git commit -m "ci: Add customized scanner configuration"
```
{: .example-code}

Push the changes upstream to your branch which updates the Pull Request.
```bash
$ git push
```
{: .example-code}

The AppMap analysis report will be updated on the completion of the build and a new report will be displayed. 

For more details about AppMap GitHub Actions refer to the [reference documentation](/docs/reference/github-action)

# Example Projects

Reference implementations of the AppMap GitHub Action are available for the following languages and frameworks:

* [**Ruby on Rails**](https://github.com/land-of-apps/sample_rails_app/blob/appmap/.github/workflows/appmap-analysis.yml)
* [**Ruby on Rails w/ Matrix Build**](https://github.com/land-of-apps/sample_rails_matrix_build/blob/appmap/.github/workflows/appmap-analysis.yml)
* [**Java Spring**](https://github.com/land-of-apps/sample_spring_app/blob/appmap/.github/workflows/appmap-analysis.yml)
* [**Java Spring w/ multiple sub-projects**](https://github.com/land-of-apps/waltz/blob/appmap-analysis/.github/workflows/appmap-analysis.yml)
* [**Python Django**](https://github.com/land-of-apps/django-oscar/blob/appmap/.github/workflows/appmap-analysis.yml)
* [**Python w/ Matrix Build**](https://github.com/land-of-apps/sample_django_app/blob/appmap/.github/workflows/appmap-analysis.yml)
* **Node.js** Coming soon!

# Matrix Builds

- [Step 1: Modify Action to Support Matrix Build](#step-1-modify-action-to-support-matrix-build)
- [Step 2: Add the Build Triggers and Analysis Step](#step-2-add-the-build-triggers-and-analysis-step)
- [(Optional) Step 3: Remove Installation Actions and Configuration](#optional-step-3-remove-installation-actions-and-configuration)
- [Step 4: Merge this PR to deploy AppMap](#step-4-merge-this-pr-to-deploy-appmap)


If your project uses matrix builds in order to split your test runs across multiple runners, you will need some additional configuration for AppMap to properly save and merge AppMap Data from across all these runs. 

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

When following the [Getting Started Guide0(#step-4-complete-the-installation-process), you'll need to make a few changes and additions to your GitHub Workflow file before you commit the first step.

First, modify the `EndBug/add-and-commit` action to include an if statement so that only one of the runners will commit the AppMap library installation files to the project. 

For Example:
```yaml
- name: Commit changes
  if: ${{ matrix.ci_node_index == 0}} #Only run this action on a single runner
  uses: EndBug/add-and-commit@v9
```
{: .example-code}

Next, you'll modify the `archive-action` to configure an `archive-id:` set to the unique index of the runner. This will archive each tarball of AppMap Data from each runner in your Action.

For example:
```yaml
- name: Archive AppMap Data
  if: always()
  uses: getappmap/archive-action@v1
  with:
    archive-id: ${{ matrix.ci_node_index }} # Set this equal to the unique index of the runner
```
{: .example-code}

After the action which runs your test cases, you will create a new job that will merge the AppMap Data archive from your individual runners, archive them, and provide the initial AppMap inventory report.

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

    - name: Merge AppMap Data Archives
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

- **Runtime Analysis:** Analyzing the AppMap Data for security flaws and anti-patterns  
- **REST API analysis** For AppMap Diagrams that include HTTP server requests, AppMap can automatically generate OpenAPI definitions.
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

If your pull request report shows changes to code behavior or new AppMap Data (when no changes are made), you may have some non-deterministic tests. For additional help resolving this, please contact the AppMap engineering team via [email](mailto:support@appmap.io) or join the [AppMap Community Slack](https://appmap.io/slack).

### (Optional) Step 3: Remove Installation Actions and Configuration

Now that AppMap configuration files are included in your project, you no longer need the `permissions` block at the top of your action (unless required for other actions) and `add-and-commit` actions in your project. Additionally, modify the `install-action` to disable library installation. The Action will require the AppMap CLI tools installed to successfully archive the AppMap Data archive from each runner. If they are left in place your project will always update to the latest released versions of AppMap libraries. Remove the following lines to have more control over future software updates.

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

# Troubleshooting

- [The AppMap GitHub Action Does Not Run in my Environment](#the-appmap-github-action-does-not-run-in-my-environment)
- [I Can't Open AppMap Diagrams in my Pull Request Report](#i-cant-open-appmap-diagrams-in-my-pull-request-report)

## The AppMap GitHub Action Does Not Run in my Environment

**Add AppMap to GitHub Allowed Actions**

If your organization limits which GitHub Actions can be used, [update your organization settings](https://docs.github.com/en/organizations/managing-organization-settings/disabling-or-limiting-github-actions-for-your-organization#allowing-select-actions-and-reusable-workflows-to-run) to allow the specific AppMap actions required for this integration to work. All AppMap Actions are published on the [GitHub Marketplace](https://github.com/marketplace?type=actions&query=getappmap+) under the `getappmap` owner namespace.

In the top right corner of GitHub.com, click your profile photo, then click **Your organizations**.

<img class="video-screenshot" src="/assets/img/docs/github-your-organizations.webp"/> 

Next to the organization, click **Settings**.

In the left sidebar, click **Actions**, then click **General**.

Under "Policies", select **Allow _OWNER_, and select _non-OWNER_, actions and reusable workflows** and add the following AppMap required actions. This will ensure that current and future actions will be supported. 

```
getappmap/*
```

Alternatively, if you would like to restrict to only the current list of actions further you can list them individually. You will need to keep this list updated as new features and functionality are added. 
```
getappmap/install-action@*,getappmap/archive-action@*,getappmap/analyze-action@*
```

<img class="video-screenshot" src="/assets/img/docs/gh-action/action-permissions.webp"/> 

## I Can't Open AppMap Diagrams in my Pull Request Report

This is caused by not having the AppMap GitHub App installed in your GitHub account.

**Install or Request the AppMap GitHub App**

The **AppMap** application authorizes your account to run AppMap in CI. It also enables you to open AppMap Diagrams in your browser.

The **AppMap** application:

- **DOES NOT** transfer any of your repository code, data, or AppMap Data to an external server.  
- **DOES** confirm that you have access via GitHub permissions to the AppMap Data stored in your repository action.  
- **DOES** open a browser tab with a signed URL that enables your browser to securely download the AppMap Data from your GitHub and display it.  
- **DOES** directly transfer data from YOUR GitHub to YOUR browser, **without** going through any other other 3rd party services.  

Organization owners can install GitHub Apps on their organization. If you are not an organization owner, you can still initiate the install process. GitHub will then send a notification to the organization owner to request them to approve the installation. Ask your organization owner to approve that request.

If you're installing into your personal account, you will already have permissions to install this app there.

1) Open the [AppMap GitHub marketplace page](https://github.com/marketplace/get-appmap) and click `Set up a plan`.

<img class="video-screenshot" src="/assets/img/docs/gh-action/marketplace-page.webp"/>

2) Select the GitHub account in which you are using AppMap, and then click the `Install` button.

<img class="video-screenshot" src="/assets/img/docs/gh-action/account-selection.webp"/>

3) Select `All Repositories`, or select to install the app into specific repositories.

<img class="video-screenshot" src="/assets/img/docs/gh-action/select-repos.webp"/> 

---
layout: docs
title: Set up AppMap in CI
description: "Learn how to leverage AppMap within GitHub Actions to analyze behavioral changes in Pull Requests. Install AppMap and configure rules for enhanced performance and security."
name: Getting Started with GitHub Actions
setup-appmap-ci: true
step: 2
render_with_liquid: false
redirect_from: [/docs/early-access/in-github-actions,/docs/analysis/in-github-actions]
---

# Getting Started with GitHub Actions <!-- omit in toc -->

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

## Step-by-step walkthrough

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

Installing the AppMap GitHub App into your repository will allow the AppMap installer to properly detect your repositories for installation. Your data is your data, AppMap does not store your code or any AppMaps that are generated. For more details about AppMap security controls, review the [Security FAQ](https://appmap.io/security).

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

- **AppMap data sources** shows how many AppMaps were recorded, and which test frameworks were used.
- **Code profile** indicates which packages and modules were recorded.
- **Web service API profile** summarizes the HTTP requests observed while your tests ran. AppMap uses this information to automatically generate OpenAPI definitions.
- **SQL profile** summarizes the SQL queries executed in your tests.

After completing the initial configuration report, AppMap will analyze your entire source code repository. In this report AppMap will display recently introduced code flaws and problems. A sample of all the problems that were found in the AppMaps are listed in order of when they were most likely introduced, with most recent first.

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

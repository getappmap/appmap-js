---
layout: docs
setup-appmap-ci: true
title: Set up AppMap in CI
description: "Optimize CI with AppMap Analysis, tracking behavioral changes in each Pull Request. Get started by installing the AppMap GitHub App from the GitHub Marketplace."
step: 1
name: How it works
redirect_from: [/docs/analysis/in-ci]
---
# Set Up AppMap in CI

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

Once you create a pull request, AppMap data is recorded as your test cases run. As AppMaps are generated, an AppMap archive file is created that includes all the AppMap data, plus some metadata about the job. As code is pushed to a branch, AppMap Analysis create an archive file for that code revision. This archive file is automatically saved as a CI artifact.  Once an archive has been created, it can be compared to the “base” revision (i.e. your mainline or production branch).  
1
## The value of AppMap in CI

We designed AppMap’s findings as a comment in the PR itself to enable the Development, QA, Architecture, and Security teams to review code faster, evaluate code independently, and catch deep-rooted code issues easier. This helps you determine the stability of new code in the context of where the code actually lives and allows for faster and more reliable code delivery. 

By simply browsing the PR comments, a DevOps team can reliably deploy code with the assurance that it meets all needed code quality requirements, reducing the amount of unnecessary communication between teams just to get the code live long before it is ever pushed to production.

## Requirements
If you have already generated AppMaps outside of CI (for example, by running your test cases locally), you can quickly deploy AppMap in CI using the same commands used to execute your test cases. If you already have an existing CI job that builds an environment to execute your test cases, AppMap Analysis can be added to that job.

## Next steps
- [Add to GitHub Actions](/docs/analysis/in-github-actions)

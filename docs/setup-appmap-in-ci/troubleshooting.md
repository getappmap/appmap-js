---
layout: docs
title: Set up AppMap in CI
description: "Learn how to troubleshoot common issues when integrating AppMap into your GitHub Actions."
name: Troubleshooting
setup-appmap-ci: true
step: 6
---

# Troubleshooting AppMap in GitHub Actions <!-- omit in toc -->

- [The AppMap GitHub Action Does Not Run in my Environment](#the-appmap-github-action-does-not-run-in-my-environment)
- [I Can't Open AppMaps in my Pull Request Report](#i-cant-open-appmaps-in-my-pull-request-report)

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

## I Can't Open AppMaps in my Pull Request Report

This is caused by not having the AppMap GitHub App installed in your GitHub account.

**Install or Request the AppMap GitHub App**

The **AppMap** application authorizes your account to run AppMap in CI. It also enables you to open AppMaps in your browser.

The **AppMap** application:

- **DOES NOT** transfer any of your repository code, data, or AppMaps to an external server.  
- **DOES** confirm that you have access via GitHub permissions to the AppMap data stored in your repository action.  
- **DOES** open a browser tab with a signed URL that enables your browser to securely download the AppMap data from your GitHub and display it.  
- **DOES** directly transfer data from YOUR GitHub to YOUR browser, **without** going through any other other 3rd party services.  

Organization owners can install GitHub Apps on their organization. If you are not an organization owner, you can still initiate the install process. GitHub will then send a notification to the organization owner to request them to approve the installation. Ask your organization owner to approve that request.

If you're installing into your personal account, you will already have permissions to install this app there.

1) Open the [AppMap GitHub marketplace page](https://github.com/marketplace/get-appmap) and click `Set up a plan`.

<img class="video-screenshot" src="/assets/img/docs/gh-action/marketplace-page.webp"/>

2) Select the GitHub account in which you are using AppMap, and then click the `Install` button.

<img class="video-screenshot" src="/assets/img/docs/gh-action/account-selection.webp"/>

3) Select `All Repositories`, or select to install the app into specific repositories.

<img class="video-screenshot" src="/assets/img/docs/gh-action/select-repos.webp"/> 

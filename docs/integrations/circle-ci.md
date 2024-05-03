---
layout: docs
title: Docs - Integrations
description: "Use AppMap Analysis within CircleCI to analyze behavioral changes per Pull Request. It offers root cause analysis, API changes tracking, security and performance findings, and more."
integrations: true
name: CircleCI
step: 3
render_with_liquid: false
redirect_from: [/docs/setup-appmap-in-ci/in-circleci]
---

# CircleCI <!-- omit in toc -->

<p class="alert alert-info">
If at any point you would like some help, <a href="/slack">join us in Slack</a>!
You'll find the AppMap team there, along with other AppMap users.
</p>

## Overview <!-- omit in toc -->
AppMap works with your test cases in CircleCI and a GitHub Action to collect, store, analyze, and report on the behavioral changes within each Pull Request. Tests can execute within your existing CircleCI build job, and AppMap Data can be retrieved by a GitHub Action to analyze the code behavior changes. 

- [How it works](#how-it-works)
- [Step-by-step walkthrough](#step-by-step-walkthrough)
  - [Prerequisites](#prerequisites)
  - [Step 1: Setup AppMap file sync in existing CircleCI Project](#step-1-setup-appmap-file-sync-in-existing-circleci-project)
  - [Step 2: Setup AppMap GitHub Action for baseline](#step-2-setup-appmap-github-action-for-baseline)
  - [Step 3: Add AppMap to compare HEAD revision](#step-3-add-appmap-to-compare-head-revision)
  - [Step 4: Merge Pull Request to enable AppMap](#step-4-merge-pull-request-to-enable-appmap)
- [Example Project Files](#example-project-files)
- [Advanced Configuration Options](#advanced-configuration-options)
  - [Prerequisites](#prerequisites-1)
  - [Step 1: Add or Update AppMap action to use `repository_dispatch` trigger](#step-1-add-or-update-appmap-action-to-use-repository_dispatch-trigger)
  - [Step 2: Update your CircleCI build to trigger the GitHub API on a successfully build completion.](#step-2-update-your-circleci-build-to-trigger-the-github-api-on-a-successfully-build-completion)
- [Next Steps](#next-steps)

<img class="video-screenshot" src="/assets/img/docs/gh-action/analysis-github-action.webp"/> 

## How it works

AppMap records the behavior of your test cases when they run in CircleCI and produces AppMap Data that can be copied to a centralized storage repository. An additional step is added in your CircleCI build job to create a tarball of that data and push the resulting file to a centralized object storage or file storage of your control. From there, the AppMap GitHub Action will download those maps and analyze them. AppMap will add comments to your Pull Request with deep insights into the runtime code changes. 

<img class="video-screenshot" src="/assets/img/docs/gh-action/circleci-github-arch-diagram.webp"/> 

In this example, the following events will happen:

<b>1) CircleCI builds your application and runs automated test cases and AppMap Data will be created in `tmp/appmap` on the CircleCI runner.</b>
- A tarball (`tar`) file of the `tmp/appmap` directory is created in the CircleCI runner.
- This tarball is copied to your chosen centralized location (such as AWS S3 or Azure Blob Storage) for secure storage and retrieval by the AppMap GitHub Action.  
  
<b>2) While the CircleCI build is running, the AppMap GitHub Action will also trigger, looking for a baseline archive for comparison.</b>
  - The AppMap GitHub Action waits until all the complete AppMap Dataset exists on the central storage location before continuing.
  - This will download the raw AppMap Data archive created by CircleCI in your previous step to generate a baseline archive for comparison.

<b>3) The GitHub Action will analyze the latest maps against the baseline for the pull request.  
  - The AppMap GitHub Action will provide a full runtime code analysis diff report as a comment in your pull request.</b>

## Step-by-step walkthrough

### Prerequisites

1) AppMap only supports project that have automated test cases. To add AppMap to your project, use either the [AppMap installer CLI](/docs/reference/appmap-client-cli.html#install) or manually add with the [AppMap libraries](/docs/reference).
   
2) A centralized storage location (such as Amazon S3 or Azure Blob Storage) for storing the raw AppMap Data archive generated from the test cases. This storage needs write access from CircleCI and read access from GitHub Actions. In this example below we will use Amazon S3.

### Step 1: Setup AppMap file sync in existing CircleCI Project

First, create a branch called `appmap-ci` in your project.  Next, in your CircleCI configuration (generally found at `.circle/config.yml`), add a run action that will create a (`tar`) of your AppMap Data after your test cases are completed. 

```yaml
- run:
    name: Create AppMap Data archive
    command: tar --remove-files -cvzf <<pipeline.git.revision>>.tar tmp/appmap/
```
{: .example-code}

Using the CircleCI pipeline value of `<<pipeline.git.revision>>` will give this archive tarball a unique file name based on the SHA the AppMap Data is based on. 

After the archive step, add the necessary steps to authenticate and copy this archive file to your centralized storage location. In our example below, we will authenticate with Amazon AWS to generate temporary credentials and then we will copy this file to the configured bucket.  In this example, copying the tarball to the `s3://circleci-appmaps/` bucket. 

```yaml
- aws-cli/setup:
    profile_name: Circle-CI-Write-to-S3
    role_arn: arn:aws:iam::12345678900:role/Circle-CI-Write-to-S3

- aws-s3/copy:
    from: <<pipeline.git.revision>>.tar
    profile_name: Circle-CI-Write-to-S3
    to: s3://circleci-appmap/
    arguments: --region us-west-2
```
{: .example-code}

[**Example Code Commit**](https://github.com/land-of-apps/circle-ci-example/commit/1b1f2e886c8ca0a166296147b083d3eb500a8c5f)

After you push this commit to your branch, CircleCI will trigger a workflow and you can confirm that the steps all completed successfully.  

<img class="video-screenshot" src="/assets/img/docs/gh-action/circle-ci-example-storage.webp"/> 

Once you have confirmed your AppMap Data archive has successfully copied to your centralized file repository, merge this branch and continue to the next step.
  
### Step 2: Setup AppMap GitHub Action for baseline

To setup the GitHub Action, create a new branch called `appmap-action` in your repository.

Create a new file with the name `.github/workflows/appmap-analysis.yml`

In this file you can use [this default action example](https://github.com/land-of-apps/rails-7-app/blob/c70b48891f38f92223ec06a654406cb7a6886890/.github/workflows/appmap-analysis.yml#L1-L77). **NOTE** Right now you will only use the first job that is listed in lines 1-77, after we create the baseline archive we'll add the AppMap job below this section.

- Download the AppMap tooling into the runner.
- Check for an existing baseline AppMap archive stored in your GitHub artifact store.
- (If no baseline AppMap archive exists) Locate and download the tarball of AppMap Data for the base revision from your chosen centralized data store.
- (If no baseline AppMap archive exists) Create an AppMap archive of the baseline AppMap Data and store to your GitHub artifact store.
 
Commit your GitHub Action workflow file to your branch and open a new Pull Request which will trigger the action.

After the action completes running successfully, check the action summary and confirm a build artifact has been created like the following screenshot.

<img class="video-screenshot" src="/assets/img/docs/gh-action/github-artifact-example.webp"/> 

### Step 3: Add AppMap to compare HEAD revision
 
After the previous step succeeds and the baseline AppMap Data is created, [update the GitHub Action](https://github.com/land-of-apps/rails-7-app/blob/c70b48891f38f92223ec06a654406cb7a6886890/.github/workflows/appmap-analysis.yml#L79-L125) to include a similar job to fetch the AppMap Data for the HEAD revision and additionally analyze the code changes for code quality problems and provide a detailed report into the pull request comments.  

[Review this example commit](https://github.com/land-of-apps/circle-ci-example/pull/2/commits/4ea72bb9c930960dafd38698749a0b1dbc2e9db8) for an example of the additional steps to add to your GitHub Action.

When the build completes successfully, you will see a comment from the GitHub Action.  After merging this Pull Request you will see a similar analysis on each new Pull Request.  

<img class="video-screenshot" src="/assets/img/docs/gh-action/initial-report.webp"/> 

Your completed installation should now look like the following [Pull Request Example.](https://github.com/land-of-apps/circle-ci-example/pull/2)

### Step 4: Merge Pull Request to enable AppMap

After you merge this Pull Request, AppMap will execute on each subsequent Pull Request.

With AppMap deployed in your project, AppMap will execute on each Pull Request and provide a detailed runtime code analysis on each new commit.  AppMap performs a thorough analysis of the runtime differences, giving you:

- Root cause analysis of failed tests.
- Web service API changes, both breaking and non-breaking.
- New and resolved security findings.
- New and resolved performance findings.
- New and resolved findings in other categories: maintainability, reliability, and user-defined rules.
- "Behavioral diffs" as sequence diagrams showing changed runtime behavior within the PR.

[Example Pull Request with Runtime Code Diff](https://github.com/land-of-apps/rails-7-app/pull/14)

<img class="video-screenshot" src="/assets/img/docs/gh-action/analysis-pull-request.webp"/>
<img class="video-screenshot" src="/assets/img/docs/gh-action/analysis-checks-with-circleci.webp"/> 

## Example Project Files

- [Example Ruby on Rails Project](https://github.com/land-of-apps/rails-7-app/)
- [Pull Request with Runtime Code Diff](https://github.com/land-of-apps/rails-7-app/pull/14)
- [CircleCI Example copying AppMap Data archive to Amazon S3](https://github.com/land-of-apps/rails-7-app/blob/c70b48891f38f92223ec06a654406cb7a6886890/.circleci/config.yml#L34-L46)
- [GitHub Action Workflow File](https://github.com/land-of-apps/rails-7-app/blob/c70b48891f38f92223ec06a654406cb7a6886890/.github/workflows/appmap-analysis.yml)

## Advanced Configuration Options

In our basic CircleCI example above, both the CircleCI test runner and the AppMap action will start running at the same time. The GitHub Action will check your central storage location every 10 seconds until your baseline maps and HEAD revision maps exist. For many projects where your test cases can complete in a short amount of time, this additional wait time in the AppMap GitHub Action is worth the cost for the simpler configuration to get started. 

But if your test cases on CircleCi take longer to run, it can be inefficient and expensive to have a GitHub Action running and waiting for files to become available. You can use the GitHub API to trigger a webhook event called `repository_dispatch` when you want to trigger a workflow for activity that happens outside of GitHub. In our case after CircleCI has successfully finished running test and pushed the AppMap archive to the central file storage location. 

Refer to the [GitHub Action documentation](https://docs.github.com/en/actions/using-workflows/events-that-trigger-workflows#repository_dispatch) for more details about how the `repository_dispatch` action trigger works.

The overall architecture largely stays the same as the basic example from above. You can see in the diagram below we've added a new step #2 where a CircleCI job will make a call to the GitHub API to trigger a webhook and start our updated GitHub Action. 

<img class="video-screenshot" src="/assets/img/docs/gh-action/advanced-circleci-github-arch-diagram.webp"/> 

### Prerequisites

- [Create a GitHub Personal Access Token](https://docs.github.com/en/enterprise-server@3.8/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) with the `repo` scope. This needs to be stored in your CircleCI account as an environment variable.
- The `repository_dispatch` trigger will only run if your workflow file is on your main branch. As such, you'll need the ability to commit to your project main branch. 
- Centralized storage setup and configured for access.  As the example above, you'll need write access from CircleCI and read access from GitHub Actions. In our example we'll be using Amazon S3.
- This walkthrough assumes you have already completed the basic setup steps in the previous example. At the very least you need to ensure you've [completed Step 2](/docs/setup-appmap-in-ci/in-circleci.html#step-2-setup-appmap-github-action-for-baseline) and have a baseline AppMap archive ready for analysis. 

### Step 1: Add or Update AppMap action to use `repository_dispatch` trigger

For this updated GitHub Action to work you'll need to commit a software utility to your project that will locate which Pull Request your commit is associated with.  Normally when a Pull Request is opened, the AppMap Action will trigger and the action payload will include details about which Pull Request the AppMap report will be associated with.  But since our action will be triggered via a webhook, it will lack information about what Pull Request is associated with the commit. 

#### Add `searchPullRequest.js` to your project <!-- omit in toc -->

You can use this JavaScript function to locate the Pull Request for your commits, and pass the relevant pull request number to the AppMap GitHub Action. [Copy the latest version from the sample project](https://github.com/land-of-apps/rails-7-app/blob/d098acdc0b3d327ebf8c9d062bedb5c779d18008/searchPullRequest.js) and add to your project. 

Add the following as a new file named `package.json` or add these project dependencies to your existing `package.json`

```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2",
    "yargs": "^17.7.2"
  }
}
```
{: .example-code}

#### Add/Update the AppMap Action to your project <!-- omit in toc -->

The most recent version of the AppMap GitHub Action that can be triggered via a [webhook is located in our sample project.](https://github.com/land-of-apps/rails-7-app/blob/cca7f276cf7c32b4b7a5af218ccf19399084777a/.github/workflows/analyze-maps-from-circleci.yml) You'll need to commit this file (configured for your environment) and the files above into the main branch of your repository.  As with the above example you'll need to save this file into the `.github/workflows/` folder. 

**Commit these files to your main branch and then continue to Step 2.**

This action has many steps to process the files and analyze your pull requests, below are details of what each step is doing.

* Reconfigure this environment variable to point to your specific central file location.
  
```yaml
env:
  appmap_storage_bucket: circleci-appmaps
```
{: .example-code}

* Use this action to set the status of your Pull Request as "pending" for the commit being built.

```yaml
- name: Set commit status as pending
  uses: myrotvorets/set-commit-status-action@f8a3f50eca0d32f3e12dc3a98792bb588bf29626
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    status: pending
    context: AppMap Analysis
    sha: ${{ github.event.client_payload.head_sha }}
```
{: .example-code}

<img class="video-screenshot" src="/assets/img/docs/gh-action/appmap-analysis-status.webp"/> 


* Install the AppMap command line tools, but do not install the libraries. 
  
```yaml
 - name: Install AppMap tools
   uses: getappmap/install-action@v1
   with:
     install-appmap-library: false
```
{: .example-code}

* Check and see if the baseline AppMap archive exists in the GitHub artifact store. This will fail if an archive is not found so we enable `continue-on-error: true`
  
```yaml
- name: Check for existing baseline archive
  id: check_for_baseline
  env:
    GITHUB_TOKEN: ${{ github.token }}
  continue-on-error: true  
  run: |
    appmap restore --check --revision ${base_sha} --github-repo ${GITHUB_REPOSITORY} --exact 
```
{: .example-code}

* If the previous step "fails" (i.e. no baseline archive exists) run these steps to download the raw AppMap Data archive and archive them for analysis.

```yaml
- name: Download and extract appmap data archive
  if: steps.check_for_baseline.outcome == 'failure'
  run: | 
    aws s3 cp s3://${appmap_storage_bucket}/${base_sha}.tar ${base_sha}.tar 
    tar xvf ${base_sha}.tar
    
- name: Archive AppMap Data archive
  if: steps.check_for_baseline.outcome == 'failure'
  uses: getappmap/archive-action@v1
  with: 
    revision: ${base_sha}
```
{: .example-code}

The 2nd section in the GitHub AppMap Action will trigger when the above steps are successful. Below is an explanation of what each of those steps is used for. 

* As in the previous example, reconfigure the storage bucket location based on where your AppMap Data archive is located.

```yaml
env:
  appmap_storage_bucket: circleci-appmaps
```
{: .example-code}

* Install Node.js and the packages required to run the `searchPullRequest.js` application.
  
```yaml
- name: Use Node.js
  uses: actions/setup-node@v2
  with:
    node-version: '18'

- name: Install dependencies
  run: npm ci
```
{: .example-code}

* Download and extract the HEAD revision AppMap Data archive sent from CircleCI

```yaml
- name: Download and extract AppMap Data archive
  run: | 
    aws s3 cp s3://${appmap_storage_bucket}/${head_sha}.tar ${head_sha}.tar 
    tar xvf ${head_sha}.tar
```
{: .example-code}

* Run `searchPullRequest.js` and locate the most recent Pull Request with the HEAD sha associated. This value will be stored in $LATESTPR.

```yaml
- name: Get only the most recent issue with this head commit
  run: echo LATESTPR=$(node searchPullRequest.js --ownerRepo=${GITHUB_REPOSITORY} --commit=${head_sha}) >> "$GITHUB_ENV"

```
{: .example-code}

* Analyze the AppMap Data archive and compare the changes between the base and head revisions, passing the `issue-number` to the analyze-action.  

```yaml
- name: Analyze AppMap Data
  uses: getappmap/analyze-action@v1
  with:
    issue-number: ${{env.LATESTPR}}
    directory: .
    base-revision: ${{ github.event.client_payload.base_sha }}
    head-revision: ${{ github.event.client_payload.head_sha }}
```
{: .example-code}

* Update the commit status for this repository_dispatch build.

```yaml
- name: Update Commit Status
 uses: myrotvorets/set-commit-status-action@v2.0.0
 if: always()
 with:
   token: ${{ secrets.GITHUB_TOKEN }}
   status: ${{ job.status }}
   context: AppMap Analysis
   sha: ${{ github.event.client_payload.head_sha }}
```
{: .example-code}

The commit status update will look like the following in a successful pull request.

<img class="video-screenshot" src="/assets/img/docs/gh-action/appmap-analysis-status-complete.webp"/> 

Make sure to commit the [searchPullRequest.js](https://github.com/land-of-apps/rails-7-app/blob/d098acdc0b3d327ebf8c9d062bedb5c779d18008/searchPullRequest.js), the [package.json](https://github.com/land-of-apps/rails-7-app/blob/d098acdc0b3d327ebf8c9d062bedb5c779d18008/package.json), and the Webhook AppMap GitHub Action before continuing to step 2.

[Here is an example commit with the changes files in an example test project.](https://github.com/land-of-apps/circle-ci-example/commit/44bcfafbaf978484fc0d29e826d28161ded89ef6)

### Step 2: Update your CircleCI build to trigger the GitHub API on a successfully build completion.  

For an example of a full CircleCI workflow, [refer to the latest version from our sample project.](https://github.com/land-of-apps/rails-7-app/blob/235f97aa4225f4e6e43715b404182f1df7d5c6f5/.circleci/config.yml)

In our example, we'll modify the CircleCI build runner from our basic example, and add a new build job called `run_appmap_analysis` which will only trigger on non-mainline code commits after the normal build succeeds.  

We don't need to trigger the Webhook based AppMap Action on a mainline branch build because analysis only happens inside of an existing Pull Request. 

First we can create a new job in our existing `.circleci/config.yml` file. 

You'll need to update the following items according to your project:

- Ensure your GitHub Personal Access Token is saved as a CircleCI secure environment variable at `$GITHUB_PAT`
- Update the URL for triggering the `repository_dispatch` project.  The format is: `https://api.github.com/repos/{ORGNAME}/{REPONAME}/dispatches`
- [Confirm the name of your `repository_dispatch`](https://github.com/land-of-apps/rails-7-app/blob/235f97aa4225f4e6e43715b404182f1df7d5c6f5/.github/workflows/analyze-maps-from-circleci.yml#L3-L7) action and update the `"event_type": "run_appmap_analysis",` accordingly. 

```yaml
run_appmap_analysis:
  docker:
    - image: cimg/ruby:3.1.2

  steps:
    - checkout

    - run:
        name: Get base Git SHA
        command: echo 'export BASE_SHA=$(git merge-base origin/main $CIRCLE_BRANCH)' >> $BASH_ENV

    - run:
        name: Run AppMap Analysis
        command: |
          curl -L \
            -X POST \
            -H "Accept: application/vnd.github.v3+json" \
            -H "Authorization: token $GITHUB_PAT" \
            -H "Content-Type: application/json" \
            -H "X-GitHub-Api-Version: 2022-11-28" \
            https://api.github.com/repos/land-of-apps/rails-7-app/dispatches \
            -d @- \<<EOF 
          {
            "event_type": "run_appmap_analysis",
            "client_payload": {
              "base_sha": "$BASE_SHA",
              "head_sha": "<< pipeline.git.revision >>"
            }
          }
          EOF
```
{: .example-code}

In your CircleCI workflow declaration section. Update the jobs so that the GitHub webhook job will only run after the build job and excluding your mainline branch. 

```yaml
workflows:
  build:
    jobs:
      - build
      - run_appmap_analysis:
          requires:
            - build
          filters:
            branches:
              ignore:
                - main
```
{: .example-code}

Now, create a new Pull Request with these changes and on your next CircleCI build, you'll see that the `run_appmap_analysis` job will execute after your normal build step.  

<img class="video-screenshot" src="/assets/img/docs/gh-action/circleci-build-example.webp"/> 

For more details refer to this [example Pull Request](https://github.com/land-of-apps/circle-ci-example/pull/3) and [commit changes](https://github.com/land-of-apps/circle-ci-example/pull/3/commits/8c328130e0572a0eee9b9a0e0b1b2d73e3909ebc) for this sample project. 

When you view your project's GitHub Actions page, you'll see the `workflow_dispatch` action trigger after CircleCI completes its build after it has uploaded the AppMap Data archive to your centralized data store.  

<img class="video-screenshot" src="/assets/img/docs/gh-action/github-action-webhook-example.webp"/> 

## Next Steps

AppMap comes with a comprehensive set of rules that are categorized by their impact on applications: Performance, Reliability, Maintainability, Stability, and Security.  [Refer to the AppMap documentation](/docs/setup-appmap-in-ci/in-github-actions.html#configure-additional-appmap-analysis-rules) to learn how to configure these rules for your project. 
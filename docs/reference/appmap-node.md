---
layout: docs
title: Docs - Reference
description: "Learn about the AppMap Agent for Node.js. Explore usage, configuration, tests, remote, request, and process recording."
toc: true
reference: true
name: AppMap Agent for Node.js
step: 6
redirect_from: [/docs/reference/appmap-agent-js]
---

# AppMap Agent for Node.js

**Note**: this agent is currently in early access. It replaces [appmap-agent-js](/docs/reference/appmap-agent-js) which is no longer in active development. [Let us know](https://github.com/getappmap/appmap-node/issues)
if your project is unable to create AppMap Data with `appmap-node`.

- [About](#about)
  - [Supported versions](#supported-versions)
- [Usage](#usage)
- [Configuration](#configuration)
- [Tests recording](#tests-recording)
  - [Recording Mocha, Jest, or Vitest test cases](#recording-mocha-jest-or-vitest-test-cases)
- [Remote recording](#remote-recording)
- [Process recording](#process-recording)
- [Request recording](#request-recording)
- [Viewing AppMap Diagrams](#viewing-appmap-diagrams)
- [GitHub repository](#github-repository)
- [Troubleshooting](#troubleshooting)

## About

`appmap-node` records [AppMap Data](https://github.com/getappmap/appmap) of your Node.js applications. 

{% include docs/what_is_appmap_snippet.md %}

### Supported versions

{% include docs/node_support_matrix.html %}

AppMap for Node.js can record applications written in both JavaScript and TypeScript.

## Usage

```
npx appmap-node <launch command>
```
{: .example-code}

AppMap for Node.js wraps your existing application launch command, and typically does not require
any special installation or configuration. 

For example, if your Node.js application is normally run with the command `npm run dev`, the following 
command would create AppMap recordings of that application's behavior when it runs:

```console
$ npx appmap-node npm run dev
```
{: .example-code}

The `appmap-node` command works by passing a modified version of the environment variable `NODE_OPTIONS`
to the launch command. This allows it to work with any Node.js command, including ones based on `npm`,
`npx`, `node`, or even shell scripts that launch Node.js applications.

AppMap Data is saved to the directory `tmp/appmap` by default, and each AppMap file ends in `.appmap.json`.

## Configuration

When you run your program, the agent reads configuration settings from `appmap.yml`. If not found, a default config file will be created. This is typically appropriate for most projects but you're welcome to review and adjust it.

Here's a sample configuration file for a typical JavaScript project:

```yaml
name: MyApp
appmap_dir: tmp/appmap
packages:
- path: .
  exclude:
  - node_modules
  - .yarn
```
{: .example-code}

- **name** Provides the project name (autodetected from *package.json*).
- **appmap_dir** Directory to place the AppMap Data in. Defaults to `tmp/appmap`.
- **packages** A list of paths which should be instrumented.

**packages**

Each entry in the `packages` list is a YAML object which has the following keys:

- **path** A path to JavaScript source files; if the project is transpiled, this should include the final js files. Relative paths are resolved with respect to *appmap.yml* location.
- **exclude** A list of path, functions and methods that will be ignored. The exclude list only applies to the *path* specified in the same package entry. Paths are resolved with respect to that *path*. For example:

```yaml
packages:
- path: dist/users
  exclude:
  - util.js
  - findUser
  - UsersController.index
- path: dist # catch-all to instrument the rest of the code
```
{: .example-code}

## Tests recording

When running test cases with `appmap-node`, a new AppMap file will be created for each unique test case.

### Recording Mocha, Jest, or Vitest test cases

Wrap your existing `mocha`, `jest`, or `vitest` test command with `appmap-node`. For example:

```console
$ npx appmap-node mocha specs/test.js
$ npx appmap-node npm test
$ npx appmap-node yarn test
```
{: .example-code}
    
When the tests are complete, the AppMap files will be stored in the default output directory `tmp/appmap/<test-framework>`,
where `<test-framework>` will be one of `mocha`, `jest`, or `vitest`.

{% include vimeo.html id='921256248' %}

## Remote recording

The `appmap-node` agent supports the [AppMap remote recording API](/docs/reference/remote-recording-api).
AppMap adds HTTP APIs that can be used to toggle recording on and off after an application has started.
Remote recording is useful when you'd like to record only during a specific time during your application's execution.

1. Run `appmap-node` as normal, passing your application's starting command as the arguments.
2. `appmap-node` will start the app and inject itself in its http stack. It will listen for [remote recording requests](/docs/reference/remote-recording-api).
3. Start the remote recording:
    - [in VS Code](/docs/reference/vscode.html#remote-recording)
    - [in JetBrains IDEs](/docs/reference/jetbrains.html#remote-recording)
    - [with curl](/docs/reference/remote-recording-api)
4. Interact with your application's API or UI to so that those features get recorded.
5. Stop the recording using the AppMap code editor plugin or curl to save the new AppMap to disk.

{% include vimeo.html id='921270684' %}

## Request Recording

AppMap for Node.js supports Request Recording. This feature automatically records an AppMap for each HTTP request
served by the application at runtime.

Request recording occurs automatically once any HTTP requests are served, and does not require special
configuration. Pass your application launch command as the argument to `npx appmap-node` and make HTTP requests
to your application as normal. 

Each API request served will create an AppMap representing the full processing of that single HTTP 
request, and will be stored in `tmp/appmap/requests`.

{% include vimeo.html id='921273327' %}

## Process recording

In the absence of tests or HTTP requests, AppMap can record an entire
Node.js application's execution from start to finish. 

Run the `appmap-node` command and give it an argument for starting your application, and it will record the entire
application's behavior by default.

```
npx appmap-node <add your Node.js application launch command here>
```
{: .example-code}

Then interact with your app using its UI or API, and AppMap Diagrams will be generated automatically. 

## Viewing AppMap Diagrams

Recorded AppMap are saved as `.appmap.json` files `tmp/appmap`. 

Follow the documentation for your IDE to open recorded `.appmap.json` AppMap files:
- [in VS Code](/docs/reference/vscode)
- [in JetBrains IDEs](/docs/reference/jetbrains)

## GitHub repository

[https://github.com/getappmap/appmap-node](https://github.com/getappmap/appmap-node)

## Troubleshooting

If you run into any issues, please make sure if you have the latest version by running `npx appmap-node@latest` first.

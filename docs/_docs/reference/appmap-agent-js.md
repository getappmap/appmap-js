---
layout: docs
title: Docs - Reference
toc: true
reference: true
name: AppMap Agent for JavaScript (legacy)
step: 8
---

# AppMap Agent for JavaScript (legacy)

**Note**: this agent is no longer in active development. For Node.js applications you should migrate to [appmap-node](/docs/reference/appmap-node). [Let](/docs/community) [us](/contact) [know](https://github.com/getappmap/appmap-node/issues)
if in your project `appmap-node` doesn't work while `appmap-agent-js` does.

- [AppMap Agent for JavaScript](#appmap-agent-for-javascript)
  - [About](#about)
    - [Supported versions](#supported-versions)
  - [Installation](#installation)
  - [Configuration](#configuration)
  - [Tests recording](#tests-recording)
    - [Recording mocha test cases:](#recording-mocha-test-cases)
    - [Recording jest test cases:](#recording-jest-test-cases)
  - [Remote recording](#remote-recording)
  - [Process recording](#process-recording)
  - [`appmap-agent-js` parameters](#appmap-agent-js-parameters)
    - [Example](#example)
  - [System Properties](#system-properties)
  - [Viewing AppMaps](#viewing-appmaps)
  - [GitHub repository](#github-repository)

## About

`appmap-agent-js` is a JavaScript package for recording [AppMaps](https://github.com/getappmap/appmap) of your code. 

{% include docs/what_is_appmap_snippet.md %}

### Supported versions

{% include docs/javascript_support_matrix.html %}

## Installation

Run this command in your Node.js project folder (where `package.json` is located): 
```sh
npx @appland/appmap@latest install
```
{: .example-code}

You will be guided through a series of steps for installing and configuring the agent.

{% include docs/install_appmap_extension.md %}

## Configuration

When you run your program, the agent reads configuration settings from `appmap.yml`. 
The `install` command creates a default `appmap.yml` file by scanning the project directories.
We recommend that you review the generated `appmap.yml` file and confirm your application name
and a list of directories that will be recorded.

Here's a sample configuration file for a typical JavaScript project:

```
# 'name' should generally be the same as the code repo name.
name: MyApp
packages:
  - path: src/server/controllers
  - path: src/server/data
  - path: src/server/models
  - path: src/server/routes
  - path: src/server/lib
    shallow: true
    exclude: 
      - src/server/lib/util
```

- **name** Provides the project name (required)
- **packages** A list of packages, classes and methods which should be
  instrumented.

**packages**

Each entry in the `packages` list is a YAML object which has the following keys:

- **path** A path to JavaScript sources files
  - **For projects with JavaScript source maps**: add paths to sources to be recorded. For example:

    ```yaml
    name: MyApp
    packages:
      - path: src/server/controllers
      - path: src/server/routes
    ```
    {: .example-code}

  - **For projects without JavaScript source maps**: include build folders. For example:

    ```yaml
    name: MyApp
    packages:
      - path: dist/controllers
      - path: dist/routes
    ```
    {: .example-code}

- **exclude** A list of sub-packages, sub-classes and sub-methods that will be ignored. The
  exclude list only applies to the `path` specified in the same package entry.
- **shallow** When set to `true`, only the first function call entry into a package will be recorded. Subsequent function calls within 
  the same package are not recorded unless code execution leaves the package and re-enters it. Default: `false`.

## Tests recording

When running test cases with the agent attached to the JavaScript engine, a new
AppMap file will be created for each unique test case.

### Recording mocha test cases:

1. Run `appmap-agent-js` with the `mocha` command and its parameters following the `--` delimiter.
   For example:

    ```sh
    npx appmap-agent-js -- mocha 'test/**/*.ts'
    ```
    {: .example-code}
    
1. `appmap-agent-js` will run the tests. When the tests are complete, the AppMaps will be stored
   in the default output directory `tmp/appmap/mocha`.

### Recording jest test cases:

1. Run `appmap-agent-js` with the `jest` command and its parameters following the `--` delimiter.
   For example:
    ```sh
    npx appmap-agent-js -- jest 'test/**/*.ts'
    ```
    {: .example-code}
1. `appmap-agent-js` will run the tests. When the tests are complete, the AppMaps will be stored
   in the default output directory `tmp/appmap/jest`.

## Remote recording

`appmap-agent-js` supports the [AppMap remote recording API](/docs/reference/remote-recording-api).
This functionality is provided by the AppMap agent. It will hook an existing HTTP engine, 
serving HTTP requests to toggle recording on and off.

**Note** Your application must be using Express.js (directly or indirectly) for remote recording to work. Express.js is requried because AppMap injects its [control routes](/docs/reference/remote-recording-api) into the Express.js middleware stack. Express-based frameworks such as Nest.js will work, as long as they are using Express under the hood.

1. Run `appmap-agent-js` with the `--recorder=remote` argument, the application-starting command, and its parameters following the `--` delimiter. For example:
    ```sh
    npx appmap-agent-js --recorder=remote -- node app/main.js --param1 hello --param2=world
    ```
    {: .example-code}
2. `appmap-agent-js` will start the app and inject itself in its http stack. It will listen for [remote recording requests](/docs/reference/remote-recording-api) on all http ports of the application.
3. Start the remote recording:
    - [in VS Code](/docs/reference/vscode.html#remote-recording)
    - [in JetBrains IDEs](/docs/reference/jetbrains.html#remote-recording)
    - [with curl](/docs/reference/remote-recording-api)
4. Interact with your application or service to exercise code included in `appmap.yml`
5. Stop the recording and save the new AppMap to disk.

## Process recording

`appmap-agent-js` can record an entire JavaScript process tree from start to finish. 

Run the `appmap-agent-js` command and give it an argument for starting your application and an argument for starting process recording.

```sh
npx appmap-agent-js --command="put the command to start your app here" --recorder=process
```
{: .example-code}

Then interact with your app using its UI or API, and AppMaps will be generated automatically. You will see them appear in the 'AppMaps' tab in the left sidebar and on the 'Explore AppMaps' page of the instructions.

--- 
## `appmap-agent-js` parameters

The most frequently used `appmap-agent-js` parameters are:
- `--recorder=[mocha|jest|remote|process]` : process recorder
  - default recorder is inferred from the starting command:
    - `mocha` if the the command contains `mocha`
    - `jest` if the the command contains `jest`
    - `process` in all other cases
  - `mocha` and `jest` recorders record AppMaps from test cases automatically
  - `remote` recorder has to be started and stopped manually with http requests
  - `process` recorder records entire processes automatically, from start to finish 
- `--command="_start command_"` : alternate method of specifying the app- or tests-starting command, wrapped in quotes
- `--log-level=[debug|info|warning|error]` :  defaults to `info`
- `--log-file=_file_` : defaults to `stderr`
- `--output-dir=_directory_` : location of recorded AppMap files, default is `tmp/appmap/<recorder>` -- eg: `tmp/appmap/mocha`
- `--help` prints out help message to stdout
- `--version` installed version

### Example

```
npx appmap-agent-js --log-level=error --recorder=remote -- node built/app.js
```

## System Properties

- `APPMAP_CONFIGURATION_PATH` Path to the `appmap.yml` config file. Default:
  _appmap.yml_
- `APPMAP_REPOSITORY_DIRECTORY` Path to the project's local git folder. Default: .

## Viewing AppMaps

Recorded AppMap are saved as `.appmap.json` files in the project folders (default location: `tmp/appmap`.) 

Follow the documentation for your IDE to open the recorded `.appmap.json` files:
- [in VS Code](/docs/reference/vscode)
- [in JetBrains IDEs](/docs/reference/jetbrains)

## GitHub repository

[https://github.com/getappmap/appmap-agent-js](https://github.com/getappmap/appmap-agent-js)


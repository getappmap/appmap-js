# Getting started with `appmap-agent-js`

`appmap-agent-js` is a JavaScript recording agent for the [AppMap](https://appmap.io) framework.

## Introduction
 
`appmap-agent-js` records AppMaps from Node.js processes when they run. There are several strategies for recording AppMaps:

1. Record test cases. At the moment, we support [jest](https://jestjs.io) and [mocha](https://mochajs.org).
2. Record Node.js processes using start/stop controls via http calls to web endpoints. These are implemented by the AppMap agent to let users control the recording remotely.
3. Record Node.js processes from start to finish.

## Installation and setup

### Requirements

Supported platforms:
* Mainstream os: Linux distros, macOS, and Windows.
* Node.js: any up-to-date major versions that is not in end-of-life -- ie: 14, 16, 18, and 19.
* Express.js: 4.
* git is highly recommended.
* mocha >= 8.0.0 is required for recording AppMaps from test cases (earlier versions do not support required root hooks).
* jest >= 25, older version might also work but have not been tested.

**Please [open a new GitHub ticket](https://github.com/getappmap/appmap-agent-js/issues/new) if your application does not satisfy the criteria or if you experience any problems with the agent.**

### Installation

Run this command in your Node.js project folder (where `package.json` is located):

```sh
npx @appland/appmap install
```

You will be guided through a series of steps for installing and configuring the agent.

Alternatively, the agent can be directly installed as a normal [npm package](https://www.npmjs.com/package/@appland/appmap-agent-js):

```sh
npm install --save-dev @appland/appmap-agent-js
```

To use remote recording, and view and interact with recorded AppMaps, we recommend installing the AppMap extension for popular code editors:
- [AppMap in VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=appland.appmap)
- [AppMap in JetBrains Marketplace](https://plugins.jetbrains.com/plugin/16701-appmap)

### Configuration

The agent will read configuration options from a file named `appmap.yml`. If this file does not exist a default one will be created. Note that the `install` command creates a suitable `appmap.yml` file by scanning the project directories. We recommend that you review any generated `appmap.yml` file and confirm your application name and a list of directories that will be recorded.

**For projects with JavaScript source maps**: add paths to sources to be recorded. For example:

```yaml
name: MyApp
packages:
  - path: src/server/controllers
  - path: src/server/data
  - path: src/server/lib
  - path: src/server/models
  - path: src/server/routes
```

**For projects without JavaScript source maps**: include build folders. For example:

```yaml
name: MyApp
packages:
  - path: dist/controllers
  - path: dist/data
  - path: dist/lib
  - path: dist/models
  - path: dist/routes
```

If you aren't sure which option to take, start with both source and build folders and optimize the `appmap.yml` file later. 

## Recording AppMaps

Once `appmap.yml` is configured for your project, you're ready to record AppMaps. 

### Recording test cases:

1. Validate that the tests run prior to recording AppMaps.
2. Prefix your test command with `npx appmap-agent-js --` For example:
```sh
npx appmap-agent-js -- mocha 'test/**/*.ts'
```
**`npm run test` does not work, only direct invocation of testing frameworks are currently supported**
3. `appmap-agent-js` will run the tests. When the tests are complete, the AppMaps will be stored in the default output directory `tmp/appmap/(mocha|jest)`.

### Recording Node.js processes with remote recording:

1. Prefix your node command with `npx appmap-agent-js --recorder=remote --`. For example:
```sh
npx appmap-agent-js --recorder=remote -- node app/main.js --param1 hello --param2=world
```
2. `appmap-agent-js` will start the app and inject itself in its http stack. It will listen for [remote recording requests](https://appland.com/docs/reference/remote-recording) on all http ports of the application.
3. Start the remote recording:
    - [in VS Code](https://appland.com//docs/reference/remote-recording#visual-studio-code)
    - [in JetBrains IDEs](https://appland.com/docs/reference/remote-recording#jetbrains-intellij-pycharm-rubymine)
    - [with curl](https://appland.com/docs/reference/remote-recording.html#remote-recording-api)
4. Interact with your application or service to exercise code included in `appmap.yml`
5. Stop the recording and save the new AppMap to disk.

### Recording Node.js processes from start to finish

1. Prefix your node command with `npx appmap-agent-js --recorder=process --`. For example:
```sh
npx appmap-agent-js --recorder=process -- node app/main.js --arg1 val1 --arg2=val2
```
2. When the node process exits, a single AppMap will be stored in `tmp/appmap/process`.

## Viewing AppMaps

Recorded AppMap are saved as `.appmap.json` files in the project folders (default location: `tmp/appmap`).

Follow the documentation for your IDE to open the recorded `.appmap.json` files:
- [in VS Code](https://appland.com/docs/reference/vscode)
- [in JetBrains IDEs](https://appland.com/docs/reference/jetbrains)

## Frequently used parameters

The most frequently used `appmap-agent-js` parameters are:
- `--recorder=[mocha|jest|remote|process]`: process recorder
  - default recorder is inferred from the starting command:
    - `mocha` if the the command contains `mocha`
    - `jest` if the command contains `jest`
    - `process` in all other cases
  - `mocha` and `jest` recorders record AppMaps from test cases automatically
  - `remote` recorder has to be started and stopped manually with http requests
  - `process` recorder records entire processes automatically, from start to finish 
    - **Warning:** AppMaps recorded with the `process` recorder can be excessively large and noisy.
- `--command="_start command_"`: alternate method of specifying the app- or tests-starting command, wrapped in quotes
- `--log-level=[debug|info|warning|error]`:  defaults to `info`
- `--log-file=_file_`: location of log file, defaults to `stderr` 
- `--appmap-dir=_directory_`: location of recorded AppMap files, default is `tmp/appmap`.

### Example

```
npx appmap-agent-js --recorder=mocha --command='mocha "test/**/*.ts"' --log-level=error
``` 

## Next steps

- [appmap-agent-js reference documentation](https://appland.com/docs/reference/appmap-agent-js.html)


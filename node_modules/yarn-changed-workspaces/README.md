# yarn-changed-workspaces

A small utility tool to be used in CI/CD pipelines along with `git` to trigger dependent libraries' workflows in a monorepo pattern.

![CI](https://github.com/igrek8/yarn-changed-workspaces/workflows/CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/igrek8/yarn-changed-workspaces/badge.svg?branch=master)](https://coveralls.io/github/igrek8/yarn-changed-workspaces?branch=master)

## Install

```
yarn global add yarn-changed-workspaces
```

## CLI

```
yarn-changed-workspaces --help
```

## Node.js

`./package.json`

```json
{
  "workspaces": ["packages/*"]
}
```

```js
const getChangedWorkspaces = require("yarn-changed-workspaces");

(async () => {
  const workspaces = await getChangedWorkspaces({
    branch: "master",
    projectRoot: process.cwd(),
  });
  console.log("changes", workspaces);
})();
```

## Control scope of change

`./package.json`

```json
{
  "private": true,
  "workspaces": ["packages/*"]
}
```

`./packages/app/package.json`

```json
{
  "name": "@team/ui",
  "version": "1.0.0",
  "workspace": { "files": ["!**/*.(test|spec).(j|t)s(x)?"] }
}
```

## Limitation

`git` is the core diffing tool. **This library will not work if you use a different distributed version-control system** for tracking changes in source code during software development

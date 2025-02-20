# appmap-js

This repository is home to a variety of AppLand JavaScript/TypeScript projects. Many of our projects
are standalone but depend on one another, meaning code changes can often span multiple projects.
This monorepo serves to simplify the code review and publishing process across all of these
projects.

## Packages

- [@appland/cli](https://github.com/getappmap/appmap-js/tree/main/packages/cli)
- [@appland/components](https://github.com/getappmap/appmap-js/tree/main/packages/components)
- [@appland/diagrams](https://github.com/getappmap/appmap-js/tree/main/packages/diagrams)
- [@appland/models](https://github.com/getappmap/appmap-js/tree/main/packages/models)
- [@appland/validate](https://github.com/getappmap/appmap-js/tree/main/packages/validate)

Looking for the AppMap client for JavaScript? Find it here:
https://github.com/getappmap/appmap-node

## Development

This project uses `yarn` workspaces to tie internal packages together. To get started, make sure
that `yarn` is installed, install the project dependencies and run an initial build.

```sh
$ npm install -g yarn
$ yarn && yarn build
```

To continuously build changes, `yarn run watch` will run a watch server for every project that
specifies a `watch` script.

### Testing

Each package should have a script named `test`. Running the following command from the root
directory will run tests in every package, and running the command from within a package directory
will run the tests for that specific package.

```sh
$ yarn test
```

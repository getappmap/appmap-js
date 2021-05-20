# appmap-js

This repository is home to a variety of AppLand JavaScript/TypeScript projects.
Many of our projects are standalone but depend on one another, meaning code
changes can often span multiple projects. This monorepo serves to simplify the
code review and publishing process across all of these projects.

## Packages

- [@appland/cli](https://github.com/applandinc/appmap-js/tree/main/packages/cli)
- [@appland/components](https://github.com/applandinc/appmap-js/tree/main/packages/components)
- [@appland/diagrams](https://github.com/applandinc/appmap-js/tree/main/packages/diagrams)
- [@appland/models](https://github.com/applandinc/appmap-js/tree/main/packages/models)

Looking for the AppMap client for JavaScript? Find it here:
https://github.com/applandinc/appmap-agent-js

## Development

This project uses `yarn` workspaces to tie internal packages together. To get
started, make sure that `yarn` is installed, install the project dependencies
and run an initial build.

```sh
$ npm install -g yarn
$ yarn
$ yarn run build
```

To continuously build changes, `yarn run watch` will run a watch server for
every project that specifies a `watch` script.

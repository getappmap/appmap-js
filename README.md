# appmap-js

This repository bundles together AppMap models and Vue components in a single
dependency.

## Project setup

```
npm install
```

## Development

Development is typically done while running
[Storybook](https://storybook.js.org/docs/vue/get-started/introduction).

```
npm run storybook
```

### grpc

```
npm run protoc
node ./src/lib/server/appmapServer.mjs
node ./src/lib/client/appmapClient.js
```

## Committing

Commits must be made according to the
[Conventional Commits specification](https://conventionalcommits.org/) to
facilitate automated releases.

## Bundling

Bundles are output to the `dist` directory.

```
npm run build
```

## Testing

New features and fixes should always have test coverage.

### Unit tests

Unit testing is performed with [Jest](https://jestjs.io/docs/en/getting-started)
and [JSDom](https://github.com/jsdom/jsdom).

To run unit tests:

```
npm run test:unit
```

## End-to-end tests

End-to-end testing is performed with [Cypress](https://docs.cypress.io/). To
open the Cypress frontend, run:

```
npm run test:e2e
```

Otherwise, Cypress can be run in headless mode by providing the `--headless`
flag.

```
npm run test:e2e -- --headless
```

## TravisCI

Travis will run the entire test suite in headless mode via:

```
npm run test
```

This command will also be run as a pre-push hook to ensure that tests are
passing before pushing. To skip this step, use the `--no-verify` flag:

```
git push origin my-branch --no-verify
```

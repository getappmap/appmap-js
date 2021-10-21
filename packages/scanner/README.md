# Appmap Scanner

Code scanning, linting, assertions and alerts.

## Development

We use `yarn` for package management. Run `yarn` to install dependencies and `yarn build` to emit
JavaScript. To run without first emitting JavaScript to the filesystem, use `yarn start`.

## Access to the private package

The `scanner` is released as a private package on Github Packages. To include it as a dependency add
these lines to your `.npmrc`:

```
@applandinc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Create a [new personal token](https://github.com/settings/tokens/new) that has `read:packages` scope
(or use existing one if any). Export it in your CLI:

```bash
export GITHUB_TOKEN=yourtokenhere
```

Add the package with `yarn`:

```bash
yarn add @applandinc/scanner
```

## Writing findings to a report
It is possible to export scanner findings to a file in human or machine  readable formats.

Text format (default):
```bash
yarn scanner -d tmp/appmap --report-file=report.txt
```

JSON format:
```bash
yarn scanner -d tmp/appmap --report=json --report-file=report.json
```

## CI integration
When using Appmap Scanner in CI you can post findings summary as a commit status and/or a PR comment 
(currently only GitHub is supported). In order to allow access to your repo you need to create a 
[personal token](https://github.com/settings/tokens/new) with following privileges and add it as a `GH_TOKEN` env variable
to your CI:
* `repo` for posting PR comments
* `repo:status` for posting commit statuses

### Commit status
```bash
yarn scanner -d tmp/appmap --commit-status=github
```

### PR comment
```bash
yarn scanner -d tmp/appmap --pull-request-comment=github
```

## New scanner ideas

* Ensure that a "circuit breaker" library is used each time an RPC is made. Learn more at https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62159c2d
* Devise `Recoverable` tokens can be [leaked into the logs](https://github.com/heartcombo/devise#password-reset-tokens-and-rails-logs).



# scanner

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

## New scanner ideas

* Ensure that a "circuit breaker" library is used each time an RPC is made. Learn more at https://netflixtechblog.com/making-the-netflix-api-more-resilient-a8ec62159c2d
* Devise `Recoverable` tokens can be [leaked into the logs](https://github.com/heartcombo/devise#password-reset-tokens-and-rails-logs).



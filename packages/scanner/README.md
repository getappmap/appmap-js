# scanner
Code scanning, linting, assertions and alerts.

## Development
We use `yarn` for package management. Run `yarn` to install dependencies and `yarn build` to emit JavaScript. To run without first emitting JavaScript to the filesystem, use `yarn start`.

## Access to the private package
The `scanner` is released as a private package on Github Packages. To include it as a dependency add these lines to your `yarnrc.yml`:
```yaml
npmScopes:
  applandinc:
    npmAlwaysAuth: true
    npmRegistryServer: "https://npm.pkg.github.com"
    npmAuthToken: ${GITHUB_TOKEN}
```
Create a [new personal token](https://github.com/settings/tokens/new) that has `read:packages` scope (or use existing one if any). Export it in your CLI:
```bash
export GITHUB_TOKEN=yourtokenhere
```
Add the package with `yarn`:
```bash
yarn add @applandinc/scanners@1.0.0
```

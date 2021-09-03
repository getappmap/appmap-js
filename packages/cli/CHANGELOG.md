# [@appland/appmap-v3.2.2](https://github.com/applandinc/appmap-js/compare/@appland/appmap-v3.2.1...@appland/appmap-v3.2.2) (2021-09-03)


### Bug Fixes

* Index is now asynchronous ([6389d47](https://github.com/applandinc/appmap-js/commit/6389d475c975aa9e2aeb9c493917e2b14584af04))
* Target ES2017 ([23ad225](https://github.com/applandinc/appmap-js/commit/23ad225ab775f2983a4ee49c2e965e7259297ce7))

# [@appland/appmap-v3.2.1](https://github.com/applandinc/appmap-js/compare/@appland/appmap-v3.2.0...@appland/appmap-v3.2.1) (2021-09-01)


### Bug Fixes

* The CLI can no longer be imported as a third party library ([bf20ac2](https://github.com/applandinc/appmap-js/commit/bf20ac2757e101ccc2d4158fc42761d5be6e0a4b))

# [@appland/appmap-v3.2.0](https://github.com/applandinc/appmap-js/compare/@appland/appmap-v3.1.0...@appland/appmap-v3.2.0) (2021-08-31)


### Features

* Rework the `agent-install` user experience ([#316](https://github.com/applandinc/appmap-js/issues/316)) ([6e34f23](https://github.com/applandinc/appmap-js/commit/6e34f236f44ab2f0a5393ecf0ef59a0fd2af2d2d))

# [@appland/appmap-v3.1.0](https://github.com/applandinc/appmap-js/compare/@appland/appmap-v3.0.0...@appland/appmap-v3.1.0) (2021-08-19)


### Bug Fixes

* Always update build.gradle and pom.xml ([fd3e820](https://github.com/applandinc/appmap-js/commit/fd3e820f1cc6cf16a827fc21389b78d6cda7ac48))


### Features

* Create agent configuration ([cdbb282](https://github.com/applandinc/appmap-js/commit/cdbb28231df51c2c0874000126f8d20bf486b2c4))

# [@appland/appmap-v3.0.0](https://github.com/applandinc/appmap-js/compare/@appland/appmap-v2.3.4...@appland/appmap-v3.0.0) (2021-08-05)


### Continuous Integration

* CLI now available as @appland/appmap ([bd99645](https://github.com/applandinc/appmap-js/commit/bd9964536056406181aab5b393800a7a8152ddbc))


### BREAKING CHANGES

* @appland/cli renamed to @appland/appmap

# [@appland/cli-v1.5.2](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.5.1...@appland/cli-v1.5.2) (2021-08-04)


### Bug Fixes

* Reword instructions for agent install ([edeacf6](https://github.com/applandinc/appmap-js/commit/edeacf6e11da1d1aad39e985c2c8be8d81307fa3))

# [@appland/cli-v1.5.1](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.5.0...@appland/cli-v1.5.1) (2021-08-03)


### Bug Fixes

* Import PythonAgentInstaller properly ([f59da43](https://github.com/applandinc/appmap-js/commit/f59da43ae0b52a18a6d0a5bda5b9913747881ca8))

# [@appland/cli-v1.5.0](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.4.0...@appland/cli-v1.5.0) (2021-08-03)


### Features

* Add python support to install-agent command ([9316233](https://github.com/applandinc/appmap-js/commit/9316233b3c703b43ecb277c6ec41f539a3a8a544))

# [@appland/cli-v1.4.0](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.3.2...@appland/cli-v1.4.0) (2021-07-29)


### Features

* Install ruby or java agent via CLI ([4d8cf37](https://github.com/applandinc/appmap-js/commit/4d8cf37a06eef6aa5aa7bf82fa4d15d52be25166))

# [@appland/cli-v1.3.2](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.3.1...@appland/cli-v1.3.2) (2021-07-06)


### Bug Fixes

* Fix parent tree assignment in canonicalization ([fd54afa](https://github.com/applandinc/appmap-js/commit/fd54afa722166ce1ac022cbd649827ac2fa84b53))

# [@appland/cli-v1.3.1](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.3.0...@appland/cli-v1.3.1) (2021-07-02)


### Bug Fixes

* Find all matching events in each AppMap ([de578c7](https://github.com/applandinc/appmap-js/commit/de578c73864e10c6b815ac460fb94b8a0b4eab92))

# [@appland/cli-v1.3.0](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.2.0...@appland/cli-v1.3.0) (2021-07-02)


### Bug Fixes

* Don't emit trigrams with no caller and no callee ([65be7e5](https://github.com/applandinc/appmap-js/commit/65be7e5c03c3cd8a233c77bbb85c5ca54a563e07))
* Only show progress bars in interactive mode ([6436a3b](https://github.com/applandinc/appmap-js/commit/6436a3b7bff79eafcfef554eb27dd581113bd9a0))
* Refine JSON output of inspect command ([101e97e](https://github.com/applandinc/appmap-js/commit/101e97e3014ac41eda49b96b2f5a4a080bbf7f07))
* Remove unused functions ([fe03064](https://github.com/applandinc/appmap-js/commit/fe030646ed6e85ecf3afc7a5f36948988e37e39e))
* Update the AppMap index before the 'inspect' command runs ([1983813](https://github.com/applandinc/appmap-js/commit/19838133180ece16879af622bf3ccb576fc6de27))


### Features

* Add 'inventory' CLI command ([8175fb0](https://github.com/applandinc/appmap-js/commit/8175fb0727b40fdfc35720ead7362ae46ea2d877))
* Add database_type to CodeObjectType.QUERY ([8787b2d](https://github.com/applandinc/appmap-js/commit/8787b2de0e05bce6753c90b3b6f08115c94e8cc7))
* Add fingerprint strategies ([066bf9e](https://github.com/applandinc/appmap-js/commit/066bf9e1d2cf4767ca105d6f794daf8f82acaed5))
* App.Land client ([775abb3](https://github.com/applandinc/appmap-js/commit/775abb3ad598031d9b95f20e7b12f88bd8d8da3b))
* Fingerprint classes and packages ([7448804](https://github.com/applandinc/appmap-js/commit/74488040e804a6f57a19878980fa3ace25d6feb4))
* Store the database_type in query classMap entries ([7a44af6](https://github.com/applandinc/appmap-js/commit/7a44af6504dc78574b3ba9eb5d1edb60d3124a44))

# [@appland/cli-v1.2.0](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.1.0...@appland/cli-v1.2.0) (2021-06-29)


### Features

* Search by package and class ([0b14a27](https://github.com/applandinc/appmap-js/commit/0b14a2727f9aadbb43b69ac14d53258f45b20cf5))
* Search for database:, http:, query: ([21df198](https://github.com/applandinc/appmap-js/commit/21df1983e47f3e77c2476dcf75fa8b8ee4ca5465))
* Show progress bar while loading 'inspect' results ([2e3c410](https://github.com/applandinc/appmap-js/commit/2e3c410ea5d60b69b6f0ea5ef035f30f289088b8))

# [@appland/cli-v1.1.0](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.0.4...@appland/cli-v1.1.0) (2021-06-16)


### Bug Fixes

* Remove 'example' because it adds so much noise ([17fb066](https://github.com/applandinc/appmap-js/commit/17fb066ba0e260911d4b204f6f6b4b310a13b7e1))


### Features

* Add 'swagger' command to the CLI ([3cb4380](https://github.com/applandinc/appmap-js/commit/3cb43808918dad92766b863326f0ff500cc235b2))
* Add version file and created time to the AppMap index ([7496e3c](https://github.com/applandinc/appmap-js/commit/7496e3ceaf1dee3f96028d64246d7ea34b314386))
* Find and print info about a named function ([544db5c](https://github.com/applandinc/appmap-js/commit/544db5ca402d9e3399326f28da7d3a43a606f5c4))
* Search AppMaps for tables and routes ([e78d5b9](https://github.com/applandinc/appmap-js/commit/e78d5b91686818001a28ac6aee93ff388ec754e8))

# [@appland/cli-v1.0.4](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.0.3...@appland/cli-v1.0.4) (2021-05-28)


### Bug Fixes

* Configure src/cli.js as the bin script for packages/cli ([0de396a](https://github.com/applandinc/appmap-js/commit/0de396a030c9451ee0f930a0f4a81281305ee312))
* In dependency analysis, read the file mtime properly as the value of the file ([3700e96](https://github.com/applandinc/appmap-js/commit/3700e96caa322969d25332a613d6a6645d7d5ca5))
* Remove dependency on yargs/helpers ([5e603d5](https://github.com/applandinc/appmap-js/commit/5e603d5b2c9e606ec82ae23ba2171f0327a7b658))

# [@appland/cli-v1.0.3](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.0.2...@appland/cli-v1.0.3) (2021-05-18)


### Bug Fixes

* Update local dependencies ([f0d3281](https://github.com/applandinc/appmap-js/commit/f0d328161499999ee98fbb3aec2d438b3095bd0f))
* Update yargs to v17.0 ([278f1da](https://github.com/applandinc/appmap-js/commit/278f1daab7bb6fc8371ac80bf210a1a6fce76f79))

# [@appland/cli-v1.0.2](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.0.1...@appland/cli-v1.0.2) (2021-05-11)


### Bug Fixes

* Add publish config ([118c54f](https://github.com/applandinc/appmap-js/commit/118c54f3db08f19de39bca7d67abd36a0071a20e))

# [@appland/cli-v1.0.1](https://github.com/applandinc/appmap-js/compare/@appland/cli-v1.0.0...@appland/cli-v1.0.1) (2021-05-11)


### Bug Fixes

* Flag package as public ([67e179c](https://github.com/applandinc/appmap-js/commit/67e179cd72ba247903764de25d8c86e0dd07bf9b))

# @appland/cli-v1.0.0 (2021-05-11)


### Features

* Initial release ([#195](https://github.com/applandinc/appmap-js/issues/195)) ([c4776a0](https://github.com/applandinc/appmap-js/commit/c4776a0514c333746846b8ffca88465f8c2739ee))

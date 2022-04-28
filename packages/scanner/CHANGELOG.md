## [1.52.4](https://github.com/applandinc/scanner/compare/v1.52.3...v1.52.4) (2022-04-28)


### Bug Fixes

* Don't traverse null property ([19cf111](https://github.com/applandinc/scanner/commit/19cf1117d5ba3a7cc4e56f214a38244814886bac))

## [1.52.3](https://github.com/applandinc/scanner/compare/v1.52.2...v1.52.3) (2022-04-28)


### Bug Fixes

* Don't enable query-from-view by default ([3c87485](https://github.com/applandinc/scanner/commit/3c87485333f18638c18b5a61542691b71d86bda8))

## [1.52.2](https://github.com/applandinc/scanner/compare/v1.52.1...v1.52.2) (2022-04-27)


### Bug Fixes

* Disable circular-dependency in default config ([0fb1864](https://github.com/applandinc/scanner/commit/0fb18644dc6a211f509138689a758d634f02a4bf))

## [1.52.1](https://github.com/applandinc/scanner/compare/v1.52.0...v1.52.1) (2022-04-27)


### Bug Fixes

* Don't traverse a null property value ([eab7ca4](https://github.com/applandinc/scanner/commit/eab7ca4fd18c5473656d4cf473638ec125612832))

# [1.52.0](https://github.com/applandinc/scanner/compare/v1.51.1...v1.52.0) (2022-04-07)


### Features

* Rule can be specified in a directory ([e929407](https://github.com/applandinc/scanner/commit/e929407c738aa0f29e55a22de6a06496c87b02ca))

## [1.51.1](https://github.com/applandinc/scanner/compare/v1.51.0...v1.51.1) (2022-04-01)


### Bug Fixes

* Upgrade `@appland/models` to v1.14.5 ([68f2382](https://github.com/applandinc/scanner/commit/68f2382812ef19f5c273a895f51c7e42f58cb7b5))

# [1.51.0](https://github.com/applandinc/scanner/compare/v1.50.0...v1.51.0) (2022-03-25)


### Bug Fixes

* Validate appId before running command ([45af060](https://github.com/applandinc/scanner/commit/45af060df4d1f34990162f0089d85ec80569fc9d))


### Features

* 'a' is an alias for 'app' ([4b2d9c7](https://github.com/applandinc/scanner/commit/4b2d9c74b40d41b71c1702fee8f08d7a7d1d1ed2))

# [1.50.0](https://github.com/applandinc/scanner/compare/v1.49.1...v1.50.0) (2022-03-25)


### Bug Fixes

* resolve AppMap path via appMapDir ([ef398a4](https://github.com/applandinc/scanner/commit/ef398a43d3cc37e6b26a265151b3a518f82d49d2))


### Features

* Add branch, commit, environment CLI options ([bffa805](https://github.com/applandinc/scanner/commit/bffa805e18936d2b78a8bda546b5bf8bef46ac5b))
* Resolve git branch and commit from the environment if available ([105f055](https://github.com/applandinc/scanner/commit/105f0559357b7efc25ca0f0ca21832165ad2a0a4))

## [1.49.1](https://github.com/applandinc/scanner/compare/v1.49.0...v1.49.1) (2022-03-23)


### Bug Fixes

* Print count of total and unique findings ([8252b19](https://github.com/applandinc/scanner/commit/8252b19d7df08d4ae1843390d3e9d20e0cadad8a))
* Provide more complete finding messages ([484d7d2](https://github.com/applandinc/scanner/commit/484d7d291368cec957e1c5322017c25c78b101db))

# [1.49.0](https://github.com/applandinc/scanner/compare/v1.48.0...v1.49.0) (2022-03-23)


### Bug Fixes

* Extract multiple secrets from a return value ([3607a93](https://github.com/applandinc/scanner/commit/3607a93a33e94172456699c08ab0056f7205cf6c))
* Recognize Symbol :failure as return value ([12849f9](https://github.com/applandinc/scanner/commit/12849f9d98d59813b30ed15b04e3eaa567410384))
* Switch from command scope to root scope ([8372ef5](https://github.com/applandinc/scanner/commit/8372ef522750f01d0c776bf1e7e7629a91134551))


### Features

* Command scope falls back on root scope ([3940eff](https://github.com/applandinc/scanner/commit/3940eff634ac326053dee3c776f20c6c0208ce4c))
* Rename job and command labels ([112050e](https://github.com/applandinc/scanner/commit/112050ed26066244101ea4fe48a5652d21273b28))

# [1.48.0](https://github.com/applandinc/scanner/compare/v1.47.0...v1.48.0) (2022-03-21)


### Features

* Add additional relatedEvents ([91ad9c1](https://github.com/applandinc/scanner/commit/91ad9c1b497f7ea2fb53b3797d005fdbab1165c7))
* relatedEvents contains the match event ([a0885de](https://github.com/applandinc/scanner/commit/a0885defdf690098e58593735d8a90d058018255))

# [1.47.0](https://github.com/applandinc/scanner/compare/v1.46.3...v1.47.0) (2022-03-17)


### Bug Fixes

* Don't fail doc parsing on new docs ([58761f6](https://github.com/applandinc/scanner/commit/58761f6112af8dcd8735b90cd1ba30ea4c08770d))


### Features

* Enable deserializationOfUntrustedData by default ([b99b729](https://github.com/applandinc/scanner/commit/b99b7292e602f20a072543439dea02560b21d250))
* Enable execOfUntrustedCommand by default ([998c2fe](https://github.com/applandinc/scanner/commit/998c2feb6c75925f5fb9b2035d285ec54b08d9be))
* Rename 'sanitize' to 'deserialize.sanitize' ([0403ebb](https://github.com/applandinc/scanner/commit/0403ebb3ff49da22137dbcaf729c67b2231750ea))
* Rename label 'public' to 'access.public' ([098ae70](https://github.com/applandinc/scanner/commit/098ae70825388a9195e38a29b355ba59cf457d6b))
* Rule for exec-of-untrusted-command ([bea4fb3](https://github.com/applandinc/scanner/commit/bea4fb319972ded78f7d2858c4344ac3a3c05a03))

## [1.46.3](https://github.com/applandinc/scanner/compare/v1.46.2...v1.46.3) (2022-03-17)


### Bug Fixes

* Better error message when server not configured ([e9c7c35](https://github.com/applandinc/scanner/commit/e9c7c35ad809efc1abdc883aa7b8345bf1752aab))
* Correctly enumerate transaction events ([ecc9bfc](https://github.com/applandinc/scanner/commit/ecc9bfcab8e5b0c35a21db98d5bbfd4d6aca2c5f))

## [1.46.2](https://github.com/applandinc/scanner/compare/v1.46.1...v1.46.2) (2022-03-11)


### Bug Fixes

* Don't error out on extra BEGIN when detecting transactions ([b3938f4](https://github.com/applandinc/scanner/commit/b3938f4397c7c2b9727e707a7df370881ae2cc65))

## [1.46.1](https://github.com/applandinc/scanner/compare/v1.46.0...v1.46.1) (2022-02-17)


### Bug Fixes

* Update SQL parser ([10be27e](https://github.com/applandinc/scanner/commit/10be27e8b365eb9080dfc8ff6edb2ee0d3fadd15))

# [1.46.0](https://github.com/applandinc/scanner/compare/v1.45.0...v1.46.0) (2022-02-15)


### Features

* Retry AppMap upload on failure ([136b59a](https://github.com/applandinc/scanner/commit/136b59a5d2f75e1ebfb533f19341680aa3050239))

# [1.45.0](https://github.com/applandinc/scanner/compare/v1.44.3...v1.45.0) (2022-02-14)


### Bug Fixes

* Pick up SQL parser fixes ([01904db](https://github.com/applandinc/scanner/commit/01904db4c12ea5f85028c34b066b9cc9bc2ec546))
* Specify Content-Length in bytes rather than chars ([b24c6a4](https://github.com/applandinc/scanner/commit/b24c6a4f32b0bb7360777ab72aa090c4b91fa810))


### Features

* Pare down the default scan config ([7f48e77](https://github.com/applandinc/scanner/commit/7f48e774b5a48af8657b736dfb619145f9785426))

## [1.44.3](https://github.com/applandinc/scanner/compare/v1.44.2...v1.44.3) (2022-02-11)


### Bug Fixes

* Provide the `metadata` param during AppMap creation ([fc1b39b](https://github.com/applandinc/scanner/commit/fc1b39bb5fc3323ae582fb499c4b9425898a5afe))

## [1.44.2](https://github.com/applandinc/scanner/compare/v1.44.1...v1.44.2) (2022-02-10)


### Bug Fixes

* Add missing dependency 'glob' ([92fe31c](https://github.com/applandinc/scanner/commit/92fe31c8d1367d31a9f21eb6e6225e2fe378432b))

## [1.44.1](https://github.com/applandinc/scanner/compare/v1.44.0...v1.44.1) (2022-02-09)


### Bug Fixes

* Fix 'merge --fail' ([3d371d9](https://github.com/applandinc/scanner/commit/3d371d9cb4512162d8ce6806ee22943ab0143877))

# [1.44.0](https://github.com/applandinc/scanner/compare/v1.43.0...v1.44.0) (2022-02-09)


### Features

* Upgrade SQL parser ([6b585e6](https://github.com/applandinc/scanner/commit/6b585e6ea16048f0e57643d6f20528f5da0aadda))

# [1.43.0](https://github.com/applandinc/scanner/compare/v1.42.0...v1.43.0) (2022-02-08)


### Features

* Add CLI 'merge' command ([5144b3d](https://github.com/applandinc/scanner/commit/5144b3d883946697442ce5393512367e53db752c))
* Implement 'merge' command options --fail and --update-commit-status ([49706c2](https://github.com/applandinc/scanner/commit/49706c2ffc7ec7450c5138da8abf3d5f16a49166))

# [1.42.0](https://github.com/applandinc/scanner/compare/v1.41.1...v1.42.0) (2022-02-04)


### Bug Fixes

* Integrate the SQL cache and collect performance data ([b0d393b](https://github.com/applandinc/scanner/commit/b0d393b4ab12ce3baeeaebadad1c0184aacc2927))
* Missing import ([042a79c](https://github.com/applandinc/scanner/commit/042a79cca1552adea0cc7f6339c4eb1abe2e00da))


### Features

* Accelerate scanning by indexing the AppMap ([5414da1](https://github.com/applandinc/scanner/commit/5414da1f628fbd44912c7c89b7f174d438162027))
* Cache normalized SQL and query AST ([ba3377f](https://github.com/applandinc/scanner/commit/ba3377f002c69379447ab89b83933e6ace7190a5))
* LRU cache for queries ([14883dd](https://github.com/applandinc/scanner/commit/14883ddd5af636db0320934692b4bf92f223069f))
* Update @appland/models and implement sqlWarning ([460e2a3](https://github.com/applandinc/scanner/commit/460e2a380b98f2c144cf835445c2da4cae7efa32))
* Update SQL parser ([691c051](https://github.com/applandinc/scanner/commit/691c051602b2f328a1c6d9eeeac704e3aead684d))


### Reverts

* Remove cache of events by type and label ([28374c2](https://github.com/applandinc/scanner/commit/28374c297d516a0f0a89fce50adedd6ff7044f4f))

## [1.41.1](https://github.com/applandinc/scanner/compare/v1.41.0...v1.41.1) (2022-02-04)


### Bug Fixes

* use relative path for doc files ([2e0b5d6](https://github.com/applandinc/scanner/commit/2e0b5d6febd7ccbe20b4ed489fbc964c68054df1))

# [1.41.0](https://github.com/applandinc/scanner/compare/v1.40.3...v1.41.0) (2022-02-04)


### Features

* add description and doc url to rule definitions ([0c237e4](https://github.com/applandinc/scanner/commit/0c237e4d3a4b6a3d6d2c12000d09ffb86fcd390d))

## [1.40.3](https://github.com/applandinc/scanner/compare/v1.40.2...v1.40.3) (2022-02-04)


### Bug Fixes

* Prevent accumulation of AppMap data while scanning ([cd8ff93](https://github.com/applandinc/scanner/commit/cd8ff93846f436e7d73a125304bbb5e7c568cd8d))

## [1.40.2](https://github.com/applandinc/scanner/compare/v1.40.1...v1.40.2) (2022-02-03)


### Bug Fixes

* Upload no longer appends AppMap directory to files ([6e28b1c](https://github.com/applandinc/scanner/commit/6e28b1cd01e0d70b175d568702caacb267d435d2))

## [1.40.1](https://github.com/applandinc/scanner/compare/v1.40.0...v1.40.1) (2022-02-02)


### Bug Fixes

* Resolve a case of unhandled promises during upload ([1bf5f90](https://github.com/applandinc/scanner/commit/1bf5f908236fc0ee9f9410fc889f0afad05b5c48))

# [1.40.0](https://github.com/applandinc/scanner/compare/v1.39.1...v1.40.0) (2022-02-02)


### Bug Fixes

* Improve Mapset and Findings upload ([055758b](https://github.com/applandinc/scanner/commit/055758ba3a23a90a62f125ca8eec8cb796471d7b))
* Remove redundant rule in default.yml sample config ([72ad9f8](https://github.com/applandinc/scanner/commit/72ad9f8f4def9a7ca2f4534545cc72413a86034e))
* Remove unused import ([bfc3fe6](https://github.com/applandinc/scanner/commit/bfc3fe67823984c20a8055c6843df73996f83856))
* Use FormData to efficiently upload AppMaps ([b8b43ee](https://github.com/applandinc/scanner/commit/b8b43ee0626207d5302312749cfd7fa5a288c966))


### Features

* Upload AppMaps, then create a Mapset, then Findings ([3403834](https://github.com/applandinc/scanner/commit/3403834dd50c446e7fa59a67038e48016d0e9f1c))

## [1.39.1](https://github.com/applandinc/scanner/compare/v1.39.0...v1.39.1) (2022-02-01)


### Bug Fixes

* Finding hash now includes rule id ([10db345](https://github.com/applandinc/scanner/commit/10db345ef472a45ad2d892a4b1df6bc7f70681cf))

# [1.39.0](https://github.com/applandinc/scanner/compare/v1.38.0...v1.39.0) (2022-01-28)


### Bug Fixes

* http-500 looks for 500 status specifically ([02a406f](https://github.com/applandinc/scanner/commit/02a406f50da3fbb33b2f758150a056011610a4cf))


### Features

* Print stack trace in CLI finding output ([edfb41a](https://github.com/applandinc/scanner/commit/edfb41af083902b71676a2899bcac6aa04b0a820))

# [1.38.0](https://github.com/applandinc/scanner/compare/v1.37.1...v1.38.0) (2022-01-26)


### Features

* Deduplicate findings in the report ([49b2db9](https://github.com/applandinc/scanner/commit/49b2db920ed702e54915574a322f286825f0d8e2))

## [1.37.1](https://github.com/applandinc/scanner/compare/v1.37.0...v1.37.1) (2022-01-25)


### Bug Fixes

* Fix Java example link ([831afd7](https://github.com/applandinc/scanner/commit/831afd75921cacdd15aa4b6f30cbe821aecbc8cf))

# [1.37.0](https://github.com/applandinc/scanner/compare/v1.36.1...v1.37.0) (2022-01-25)


### Features

* Update rule deserializationOfUntrustedData and add a test ([25fa0b5](https://github.com/applandinc/scanner/commit/25fa0b5cb746857c7234eba18160530b795a9acb))

## [1.36.1](https://github.com/applandinc/scanner/compare/v1.36.0...v1.36.1) (2022-01-24)


### Bug Fixes

* Only process a couple appmaps at a time ([0ec9a37](https://github.com/applandinc/scanner/commit/0ec9a377991213d7dd1fe5f152d037ee52ccd86f))

# [1.36.0](https://github.com/applandinc/scanner/compare/v1.35.1...v1.36.0) (2022-01-21)


### Bug Fixes

* authz-before-authn finding event is the event that provides authorization ([30c4b50](https://github.com/applandinc/scanner/commit/30c4b503e7005a9d5efe21e72d1a99e596551e79))


### Features

* Add more rules to default config ([06a2bf5](https://github.com/applandinc/scanner/commit/06a2bf5735db83df91771caa5855c57971b43eff))
* Add rule deserialization-of-untrusted-data ([cb80d48](https://github.com/applandinc/scanner/commit/cb80d48553895b450274629a2e2a085a7b648a98))
* Add rule logout-without-session-reset ([d7ae001](https://github.com/applandinc/scanner/commit/d7ae001e490540e94d422db93102f5fba1dfb234))

## [1.35.1](https://github.com/applandinc/scanner/compare/v1.35.0...v1.35.1) (2022-01-19)


### Bug Fixes

* Upload the entire findings JSON ([f502d0e](https://github.com/applandinc/scanner/commit/f502d0e646980b580a81c3f87e800e2b6459732a))

# [1.35.0](https://github.com/applandinc/scanner/compare/v1.34.1...v1.35.0) (2022-01-18)


### Features

* Update CWE references ([b036dcd](https://github.com/applandinc/scanner/commit/b036dcde862b61ad5aa09a2fe4747c6971a3853c))

## [1.34.1](https://github.com/applandinc/scanner/compare/v1.34.0...v1.34.1) (2022-01-14)


### Bug Fixes

* Upgrade @appland/client to v1.1.3 ([223441a](https://github.com/applandinc/scanner/commit/223441ab9c768482cdc3a1320c3913990401b0ff))

# [1.34.0](https://github.com/applandinc/scanner/compare/v1.33.2...v1.34.0) (2022-01-14)


### Bug Fixes

* Replace id with rule in rule doc front matter (reqd by Jekyll) ([ac5391d](https://github.com/applandinc/scanner/commit/ac5391d00672747ac956610275659cc1a110c742))


### Features

* Add references to rule definitions ([d9d29d7](https://github.com/applandinc/scanner/commit/d9d29d7b9a949deae1c746ad9d8bb3c4229e41ee))
* Add scope to rule doc front matter ([660582d](https://github.com/applandinc/scanner/commit/660582d9e22781a20c77abf9082f50c528f2341c))
* Add scope to rule doc front matter ([9fa209b](https://github.com/applandinc/scanner/commit/9fa209bba9c3336a8b73ea09075b424c19dd4299))
* Generate front matter from Rule info ([e1f64fd](https://github.com/applandinc/scanner/commit/e1f64fda238a0b78ec8f4b9301bd1546296ccd7b))
* Include labels in rule doc front matter ([e4d26ec](https://github.com/applandinc/scanner/commit/e4d26ec3c4ac0d2b51f4f7fe90f900cce120db96))
* Publish to NPM ([8dc5c85](https://github.com/applandinc/scanner/commit/8dc5c85f48d291048e24aa95212a575e89ad4175))

## [1.33.2](https://github.com/applandinc/scanner/compare/v1.33.1...v1.33.2) (2022-01-12)


### Bug Fixes

* Flag insecure comparison correctly in more cases ([abaf078](https://github.com/applandinc/scanner/commit/abaf078a37ccc8dfe9b85074e26924b130a422c7))

## [1.33.1](https://github.com/applandinc/scanner/compare/v1.33.0...v1.33.1) (2022-01-10)


### Bug Fixes

* Mark package as public ([aa18d96](https://github.com/applandinc/scanner/commit/aa18d96110057c8bb1711e7142ef1f0a7df509be))

# [1.33.0](https://github.com/applandinc/scanner/compare/v1.32.0...v1.33.0) (2022-01-10)


### Features

* Publish to NPM ([b39f16d](https://github.com/applandinc/scanner/commit/b39f16d5ab867528d8bcf3cfda67f71e59064a7d))

# [1.32.0](https://github.com/applandinc/scanner/compare/v1.31.2...v1.32.0) (2022-01-07)


### Bug Fixes

* Fix default config path ([bb28a87](https://github.com/applandinc/scanner/commit/bb28a87ff25f99d86a44e17b0d7b3cd50a68b32c))
* Tweak the findings output ([b16f552](https://github.com/applandinc/scanner/commit/b16f5520703a99eff6b51bcf6ce5c3406c13cfb2))
* Update @appland/models for DFS dependency traversal fix ([bacc707](https://github.com/applandinc/scanner/commit/bacc70748c4df5352bb181f764929c99ffe026a2))


### Features

* Print the path to the scanner config file ([531f531](https://github.com/applandinc/scanner/commit/531f53125b3faf0a619c409ee2dd8fd30d308aba))

## [1.31.2](https://github.com/applandinc/scanner/compare/v1.31.1...v1.31.2) (2022-01-06)


### Bug Fixes

* Upload all findings from ci ([ba0190d](https://github.com/applandinc/scanner/commit/ba0190ded67d74cf8697a5736e9a277fce18ab10))

## [1.31.1](https://github.com/applandinc/scanner/compare/v1.31.0...v1.31.1) (2022-01-06)


### Bug Fixes

* ci command always merges server finding status ([091b932](https://github.com/applandinc/scanner/commit/091b932d12ae91e71afb494124a0c027baae580e))

# [1.31.0](https://github.com/applandinc/scanner/compare/v1.30.0...v1.31.0) (2022-01-05)


### Bug Fixes

* Remove postPullRequestComment because it doesn't work ([54f4797](https://github.com/applandinc/scanner/commit/54f4797977c8979d26b95be4890f7793af8434a7))
* Remove unused imports ([f4e1eeb](https://github.com/applandinc/scanner/commit/f4e1eebc2e1d7cc2b1735623251d3319a496ccef))
* Update @appland/client ([f48dbd0](https://github.com/applandinc/scanner/commit/f48dbd0bf3d0ba385ac5f8058ee64a2cca2dd12c))


### Features

* Add @appland/models and @appland/client as dependencies ([23559b8](https://github.com/applandinc/scanner/commit/23559b89dfa5bff507e6b96eaee47b82af10bccd))
* Add CI command to scan, upload, and update commit status ([9c3908f](https://github.com/applandinc/scanner/commit/9c3908fbce819d6feffd0b6e264b6b53b23ee3ed))
* Fetch finding status from the server and incorporate into the client output ([981729f](https://github.com/applandinc/scanner/commit/981729fccd4455b54fd32eb2c3932e813e18d2b6))
* Refactor CLI into subcommands ([d27e05f](https://github.com/applandinc/scanner/commit/d27e05f976d0e2a0e8b3f8824e46caee17fc4c83))
* Remove @appland/models types, use types defined in the package dependency ([f872b5c](https://github.com/applandinc/scanner/commit/f872b5c614519f54adfc029206e324642fce122d))
* Tune the console report of findings ([34aaf65](https://github.com/applandinc/scanner/commit/34aaf6599e21f4523439a735254948d431bd5dea))
* Upload findings to AppMap server ([9cf0148](https://github.com/applandinc/scanner/commit/9cf0148e407ef2a990a490dbdd2fbad71055044a))

# [1.30.0](https://github.com/applandinc/scanner/compare/v1.29.1...v1.30.0) (2021-12-14)


### Features

* Add additional summary data to the findings report ([5e38336](https://github.com/applandinc/scanner/commit/5e38336b273fb408457b864f9a6f0b759f6775a5))
* Findings report includes the user-provided configuration ([ac4fda7](https://github.com/applandinc/scanner/commit/ac4fda77edcc31731a31392bca7655f7383c0213))

## [1.29.1](https://github.com/applandinc/scanner/compare/v1.29.0...v1.29.1) (2021-12-10)


### Bug Fixes

* Workaround for event.message being null ([b9408c9](https://github.com/applandinc/scanner/commit/b9408c9d9b3089c2fb919620461f86d8bad2ad4e))

# [1.29.0](https://github.com/applandinc/scanner/compare/v1.28.0...v1.29.0) (2021-12-09)


### Bug Fixes

* Let the console handle the line breaks, because they are happening in the wrong place anyway ([51cabe7](https://github.com/applandinc/scanner/commit/51cabe77a13596b1898a32aa6b06bd61129d9365))


### Features

* Continue adding rules ([2d90d2d](https://github.com/applandinc/scanner/commit/2d90d2d6c3b1b77e322346a6a283b1a36367532a))
* Port tests to new architecture ([07b074a](https://github.com/applandinc/scanner/commit/07b074a91e47ab8f6ba0971c1bdac9eda5bc756f))
* Separate the rule name from check id ([633ab1f](https://github.com/applandinc/scanner/commit/633ab1f8f7ef9fad31b009baedd776b86536e093))
* Update @appland/models for upgraded SQL parsing ([717b707](https://github.com/applandinc/scanner/commit/717b70706e1bea81efdae4cee718d1c5340ef8d6))

# [1.28.0](https://github.com/applandinc/scanner/compare/v1.27.0...v1.28.0) (2021-12-06)


### Bug Fixes

* Perform unix- and mac-friendly JSON schema fixup ([eedcdae](https://github.com/applandinc/scanner/commit/eedcdaed9f28d47e9e028ff3b203386c4a408ddd))
* Remove incorrect MatchPatternConfig from schema ([2986007](https://github.com/applandinc/scanner/commit/298600772247672b784d1b83aeb8bbe26da4996f))


### Features

* Implement case-insensitive pattern test ([ee0e825](https://github.com/applandinc/scanner/commit/ee0e82502347dd6ffe506ccded466cb26a3615cd))
* Unify filter patterns ([ece354d](https://github.com/applandinc/scanner/commit/ece354d6b023eb1bdd53a7a4d2b26482ce6874b7))

# [1.27.0](https://github.com/applandinc/scanner/compare/v1.26.0...v1.27.0) (2021-12-04)


### Features

* implement count joins logic in the scanner ([9461db7](https://github.com/applandinc/scanner/commit/9461db7dc7b12ee13aae5c63095c7b2ac65a4b17))

# [1.26.0](https://github.com/applandinc/scanner/compare/v1.25.2...v1.26.0) (2021-12-03)


### Bug Fixes

* unbatchedMaterializedQuery handles null ast ([9433d10](https://github.com/applandinc/scanner/commit/9433d100f111b8ebf5f4537d720b4e247ade98f7))


### Features

* Add graph data structures and algorithms ported to TS ([3e56554](https://github.com/applandinc/scanner/commit/3e56554e69f742e4e79e79fd89017ac5955162df))
* circularDependency scanner ([e24a5cc](https://github.com/applandinc/scanner/commit/e24a5ccd63cf72da8f4d95b064ac2ab228da39e0))
* Detect all cycles in the graph ([e55b7d4](https://github.com/applandinc/scanner/commit/e55b7d4384d4c2242e7cded8b1a73cf6630fac11))
* Display a group message and occurrance count ([e64dbf1](https://github.com/applandinc/scanner/commit/e64dbf1f0d77f5b5ba1a6e3f39b3a38cfec73c44))
* Find specific event sequences that lead to a cycle ([b790053](https://github.com/applandinc/scanner/commit/b7900533f080b86f677c30ee35923623618ec371))

## [1.25.2](https://github.com/applandinc/scanner/compare/v1.25.1...v1.25.2) (2021-12-01)


### Bug Fixes

* Pack JSON files into native binaries ([b39849a](https://github.com/applandinc/scanner/commit/b39849a29c4f658208e771e46992bca59344e20b))

## [1.25.1](https://github.com/applandinc/scanner/compare/v1.25.0...v1.25.1) (2021-12-01)


### Bug Fixes

* Deploy native binaries ([cda6369](https://github.com/applandinc/scanner/commit/cda6369de1fdf59abaa78dceee33e9b1e3d09c82))

# [1.25.0](https://github.com/applandinc/scanner/compare/v1.24.1...v1.25.0) (2021-12-01)


### Bug Fixes

* Correct schema of scanner 'exclude' ([42f00be](https://github.com/applandinc/scanner/commit/42f00beb083d13a08e4f8ead34936cf3e6bca6ad))
* Don't flag authz-before-authn if permission is denied ([03cf321](https://github.com/applandinc/scanner/commit/03cf321236d1d2a2cb240c1e9deed064c1a57f4e))
* Simplify assertion exclude filter check ([14d4676](https://github.com/applandinc/scanner/commit/14d46763c96cb89bb039bc416b103acc7df21ebd))


### Features

* SQL strings can be filtered ([be3ac6f](https://github.com/applandinc/scanner/commit/be3ac6f679835757c0edb0e9d6ae7e1b65412121))

## [1.24.1](https://github.com/applandinc/scanner/compare/v1.24.0...v1.24.1) (2021-11-29)


### Bug Fixes

* Export labels in assertion spec ([aaf9fbb](https://github.com/applandinc/scanner/commit/aaf9fbb83785ef85161a05e77b6429144bf62ca0))

# [1.24.0](https://github.com/applandinc/scanner/compare/v1.23.0...v1.24.0) (2021-11-29)


### Features

* Scanner for job not cancelled ([2ec0488](https://github.com/applandinc/scanner/commit/2ec0488f619de85c4dfaefa3a45addcdffae9816))

# [1.23.0](https://github.com/applandinc/scanner/compare/v1.22.2...v1.23.0) (2021-11-22)


### Bug Fixes

* Ensure existance of constants for all labels ([451eddb](https://github.com/applandinc/scanner/commit/451eddb50d486724edb8f3f8117ba21993e63385))
* Update rails sample app config ([551a67d](https://github.com/applandinc/scanner/commit/551a67dd92ce2a2d02de1aed08f17431cdc2d2a5))


### Features

* Reconcile and standardize scanner options ([e5dcedb](https://github.com/applandinc/scanner/commit/e5dcedbefb4b504ff0752db6d9d51e6e11944bbd))
* Support regexp or function as filter expression ([88a5fab](https://github.com/applandinc/scanner/commit/88a5fabaf7e6b995f8d730f3221ee7597686cfdb))
* Validate configuration schema before scanning ([53d4e9d](https://github.com/applandinc/scanner/commit/53d4e9d1395e8020e358000c4e3a8f8f53eb7890))
* Validate scanner properties against Options defined by JSON schema ([cbd9167](https://github.com/applandinc/scanner/commit/cbd9167a49b3725bab4cfef333750b4c5e806788))

## [1.22.2](https://github.com/applandinc/scanner/compare/v1.22.1...v1.22.2) (2021-11-17)


### Bug Fixes

* Expose finding hash ([6ef2565](https://github.com/applandinc/scanner/commit/6ef256571894c9b5eae4c11ad499c2a148308d85))

## [1.22.1](https://github.com/applandinc/scanner/compare/v1.22.0...v1.22.1) (2021-11-16)


### Bug Fixes

* disable yarn cache ([baae1a3](https://github.com/applandinc/scanner/commit/baae1a37064df1a276941715816940aedc49ad74))

# [1.22.0](https://github.com/applandinc/scanner/compare/v1.21.0...v1.22.0) (2021-11-16)


### Bug Fixes

* Copy sampleConfig files to built directory ([f89d7aa](https://github.com/applandinc/scanner/commit/f89d7aac435407b81c07b6cc4c6f107a9950c3d4))
* Ensure existance of built directory when copying sample config ([0e047ed](https://github.com/applandinc/scanner/commit/0e047edaa3564d771d417ab69e3483d99eafa85c))
* Fail the scan when no appmap dir or file is specified ([501deae](https://github.com/applandinc/scanner/commit/501deae182fb4aa51d07480ec0de230f78cbf994))


### Features

* Update default config with no-label scanners ([c1c7a6f](https://github.com/applandinc/scanner/commit/c1c7a6fd98b4ce48aebcf144dbb18a963fab18df))

# [1.21.0](https://github.com/applandinc/scanner/compare/v1.20.1...v1.21.0) (2021-11-16)


### Features

* Find unbatched materialized query ([2e3535b](https://github.com/applandinc/scanner/commit/2e3535b7443c18b279ef6f5e5901926f064cefff))
* Specify types for scanner options and export as JSON schema ([ed197ca](https://github.com/applandinc/scanner/commit/ed197cab2db49d7c7adbe8caea537984f9a98676))

## [1.20.1](https://github.com/applandinc/scanner/compare/v1.20.0...v1.20.1) (2021-11-12)


### Bug Fixes

* Remove broken scope 'appmap' ([fad8ffa](https://github.com/applandinc/scanner/commit/fad8ffaa4959db973bacdf7589a208a78c479c40))
* Update and correct use of scopes and enumerateScope by scanners ([9395113](https://github.com/applandinc/scanner/commit/939511379654f59b89d2976970e3da457062baa9))
* Update Rails Sample App use of scanners ([1e64211](https://github.com/applandinc/scanner/commit/1e64211854a8b93e4a56272801d4b913b6905c0a))

# [1.20.0](https://github.com/applandinc/scanner/compare/v1.19.0...v1.20.0) (2021-11-09)


### Features

* Scan for authorization before authentication ([3d3b1eb](https://github.com/applandinc/scanner/commit/3d3b1eb21870728e02cd4fb064325f7d2e274f89))

# [1.19.0](https://github.com/applandinc/scanner/compare/v1.18.0...v1.19.0) (2021-11-09)


### Bug Fixes

* Upgrade semantic-release ([45dad94](https://github.com/applandinc/scanner/commit/45dad947ba13be458cda12ea920dc22ff9d02d94))


### Features

* Scan for too many joins ([1de7bfc](https://github.com/applandinc/scanner/commit/1de7bfcf40b39dd521bc7676ed0842a50a0ef742))

# [1.18.0](https://github.com/applandinc/scanner/compare/v1.17.0...v1.18.0) (2021-11-04)


### Bug Fixes

* Disable IDE links when exporting findings to a file ([9bbea63](https://github.com/applandinc/scanner/commit/9bbea638402fc9ed7bce7dd3ef9ebe4ef7a8fea0))


### Features

* Add AssertionSpec type for scanner definitions ([74de27a](https://github.com/applandinc/scanner/commit/74de27a071eeb689950e5e5d1da8c19804d3d537))
* Add CI integration docs ([1dc0ad4](https://github.com/applandinc/scanner/commit/1dc0ad462f6602f704e737fb737960cff8f65081))
* Add OpenAPI generation for http_client_request ([1fc93e1](https://github.com/applandinc/scanner/commit/1fc93e181ac6ac1d335a49fda72582f81f13802e))
* Add scanner for slow method calls ([e5366fa](https://github.com/applandinc/scanner/commit/e5366fa31a4fe506e1ad27c9b0a16f7310f8610b))
* Analyze and print OpenAPI breaking changes ([858f833](https://github.com/applandinc/scanner/commit/858f83383f136bd329e7e83dd2f488f1c6f2d33e))
* OpenAPI schema are cached by host ([4b2ac60](https://github.com/applandinc/scanner/commit/4b2ac60d74e326325759ddf0f83b8ab9d3d91ecb))
* Report distinct finding messages in the final summary ([3f946ba](https://github.com/applandinc/scanner/commit/3f946bab9cc2bf7e8ba83e219687002a6241822f))

# [1.17.0](https://github.com/applandinc/scanner/compare/v1.16.0...v1.17.0) (2021-10-21)


### Bug Fixes

* Fix env var name for commit status ([444491c](https://github.com/applandinc/scanner/commit/444491c453113c1eb5b80f4a168e236d86c63f54))
* Increase the threshold for "too-many-updates" ([0b69a6e](https://github.com/applandinc/scanner/commit/0b69a6eef97d49e036f6d484a2b7ecc9fe1a4314))
* Remove unused import ([44bb518](https://github.com/applandinc/scanner/commit/44bb5181e023e033c22b41e35c365a9e25680d07))
* Report the total match number for n+1 and too-many-updates ([ae4c015](https://github.com/applandinc/scanner/commit/ae4c01539ff174401643ca8145df15be348576eb))


### Features

* Assertion can choose whether to check all events in the scope, or just the root ([5993f2c](https://github.com/applandinc/scanner/commit/5993f2c388f155194faa5573c90d2c2ad58d3419))
* Check rpc-without-circuit-breaker ([8eed0b0](https://github.com/applandinc/scanner/commit/8eed0b0b9f01336f6c52ce9e4f3bc196ddaf0de1))
* Optional pull request comments ([dd953d2](https://github.com/applandinc/scanner/commit/dd953d2c0636a66e550fdbd67ad7dbf5d4e6e83c))
* Report related events in a Finding ([9c75bdd](https://github.com/applandinc/scanner/commit/9c75bdd7d2a98db246d914f7d8320a55483d1766))

# [1.17.0](https://github.com/applandinc/scanner/compare/v1.16.0...v1.17.0) (2021-10-21)


### Bug Fixes

* Fix env var name for commit status ([444491c](https://github.com/applandinc/scanner/commit/444491c453113c1eb5b80f4a168e236d86c63f54))
* Increase the threshold for "too-many-updates" ([0b69a6e](https://github.com/applandinc/scanner/commit/0b69a6eef97d49e036f6d484a2b7ecc9fe1a4314))
* Remove unused import ([44bb518](https://github.com/applandinc/scanner/commit/44bb5181e023e033c22b41e35c365a9e25680d07))
* Report the total match number for n+1 and too-many-updates ([ae4c015](https://github.com/applandinc/scanner/commit/ae4c01539ff174401643ca8145df15be348576eb))


### Features

* Assertion can choose whether to check all events in the scope, or just the root ([5993f2c](https://github.com/applandinc/scanner/commit/5993f2c388f155194faa5573c90d2c2ad58d3419))
* Check rpc-without-circuit-breaker ([8eed0b0](https://github.com/applandinc/scanner/commit/8eed0b0b9f01336f6c52ce9e4f3bc196ddaf0de1))
* Optional pull request comments ([dd953d2](https://github.com/applandinc/scanner/commit/dd953d2c0636a66e550fdbd67ad7dbf5d4e6e83c))
* Report related events in a Finding ([9c75bdd](https://github.com/applandinc/scanner/commit/9c75bdd7d2a98db246d914f7d8320a55483d1766))

# [1.16.0](https://github.com/applandinc/scanner/compare/v1.15.0...v1.16.0) (2021-10-19)


### Bug Fixes

* Fix titled summary ([29dfe5e](https://github.com/applandinc/scanner/commit/29dfe5e9350f9c4108135d4e9aad92f3be376ee3))


### Features

* Add doc/architecture.md ([06ca4c5](https://github.com/applandinc/scanner/commit/06ca4c5bad5380d477cf862ac007d6e3cb88b4eb))
* Assertion is instantiated once for each scope occurrance, simplifying bookkeeping ([b007bc9](https://github.com/applandinc/scanner/commit/b007bc9094c63296dcf295dcee51eca39a64f475))
* Describe scopes in architecture doc ([27b1ebb](https://github.com/applandinc/scanner/commit/27b1ebb7244f64dbd062029683621b25adba4f4e))
* Implement scopes ([07cc23e](https://github.com/applandinc/scanner/commit/07cc23ed871a2ffce6e2dee477a4b259d650cc79))
* Update architecture doc with Scope concept ([043e4d9](https://github.com/applandinc/scanner/commit/043e4d9babb5f6cc290bfba95336d68fcad1d0de))

# [1.15.0](https://github.com/applandinc/scanner/compare/v1.14.0...v1.15.0) (2021-10-15)


### Features

* Illegal package dependency ([1b31cea](https://github.com/applandinc/scanner/commit/1b31cea8ccad8f52470eb880fcfd0d245578ba2f))

# [1.14.0](https://github.com/applandinc/scanner/compare/v1.13.0...v1.14.0) (2021-10-15)


### Bug Fixes

* Fix error/warning of n+1 query check ([6065085](https://github.com/applandinc/scanner/commit/606508585c32b1b5705cd62bbf90239295e006a4))


### Features

* Better findings report generation ([0065442](https://github.com/applandinc/scanner/commit/00654427f6850317e948d01d5cde6ae6a2b20c3b))
* Scan for http 500 error ([dd2dfb6](https://github.com/applandinc/scanner/commit/dd2dfb66983935e4649adfa9c009cf3b5dffe2bf))

# [1.13.0](https://github.com/applandinc/scanner/compare/v1.12.4...v1.13.0) (2021-10-15)


### Bug Fixes

* Fix short name for validateBeforeSave ([0cc4bcc](https://github.com/applandinc/scanner/commit/0cc4bccb2fa0fd1ff46fbbc036ebb1c3a934282b))
* Fixes to scanners ([b1a264a](https://github.com/applandinc/scanner/commit/b1a264a5c9dede1fc38ddfc12281365a09bfe75f))


### Features

* Add JSON reporting ([fe70006](https://github.com/applandinc/scanner/commit/fe700063d9b9f3c4c493178edc9a404e4dd81234))
* Find insecure comparison of secrets ([fd3f80e](https://github.com/applandinc/scanner/commit/fd3f80ebd520c8cc257dd321e84d23fbd74f7385))

## [1.12.4](https://github.com/applandinc/scanner/compare/v1.12.3...v1.12.4) (2021-10-06)


### Bug Fixes

* await github responses ([ee4fd29](https://github.com/applandinc/scanner/commit/ee4fd29dc3786b1447de5c732d45a8723ebf2081))

## [1.12.3](https://github.com/applandinc/scanner/compare/v1.12.2...v1.12.3) (2021-10-06)


### Bug Fixes

* stringify response object ([69225a9](https://github.com/applandinc/scanner/commit/69225a9dfa1791becfde17a1d882b04f0fd5232f))

## [1.12.2](https://github.com/applandinc/scanner/compare/v1.12.1...v1.12.2) (2021-10-06)


### Bug Fixes

* use callback to print github responses ([7645931](https://github.com/applandinc/scanner/commit/76459314940310c1bc5a79449abbe215d8739bff))

## [1.12.1](https://github.com/applandinc/scanner/compare/v1.12.0...v1.12.1) (2021-10-06)


### Bug Fixes

* print github commit status responses ([c798deb](https://github.com/applandinc/scanner/commit/c798deb3706ada35e7306a482d56e1dbd77e83a9))

# [1.12.0](https://github.com/applandinc/scanner/compare/v1.11.2...v1.12.0) (2021-10-05)


### Features

* Configure scanner properties from YAML ([690ed5f](https://github.com/applandinc/scanner/commit/690ed5f4b6dfadde23de11446c1e93abe95ff89e))
* Enumerate labels which are used in the scanner ([827d56f](https://github.com/applandinc/scanner/commit/827d56fa80ac9c21ac5ce2e09d0552df5b64045d))

## [1.11.2](https://github.com/applandinc/scanner/compare/v1.11.1...v1.11.2) (2021-10-05)


### Bug Fixes

* include secretsRegexes.json into built directory ([b733283](https://github.com/applandinc/scanner/commit/b7332835566f2b7bf03f3b14601cb14b641105dc))

## [1.11.1](https://github.com/applandinc/scanner/compare/v1.11.0...v1.11.1) (2021-10-05)


### Bug Fixes

* properly read owner/repo/sha ([ca02937](https://github.com/applandinc/scanner/commit/ca0293774a552ede96a4804faba2782e815299e7))

# [1.11.0](https://github.com/applandinc/scanner/compare/v1.10.0...v1.11.0) (2021-10-01)


### Bug Fixes

* Don't write results into appmap index dir (which may not exist) ([ff402cb](https://github.com/applandinc/scanner/commit/ff402cbbe31636bad48247b1d18549998288075e))
* Fix declaration of Event#returnValue ([97b4b36](https://github.com/applandinc/scanner/commit/97b4b364587f7f0685719ae1171af0c30ffe265a))
* Implement proper usage of HTTP status and mime_type ([bb56aef](https://github.com/applandinc/scanner/commit/bb56aef2c7b62520779b40e3dc0fd213ae731c74))
* Leave absolute paths alone when generating links ([ab9f358](https://github.com/applandinc/scanner/commit/ab9f358151af69529406cee070501d812446b27b))


### Features

* Add a generic secret regexp ([7fa5e22](https://github.com/applandinc/scanner/commit/7fa5e229f145eda8e14f291ad95442216ba8f726))
* Deeper verbose logging ([970171c](https://github.com/applandinc/scanner/commit/970171c6903e3b6d0fb14324a98135aa7d4717ec))
* Enable multiple matches, custom messages, and problem level ([206c9b5](https://github.com/applandinc/scanner/commit/206c9b58e457673cb2403666d9c41c834c40c2fe))
* Enable validation of a single AppMap file ([a75e336](https://github.com/applandinc/scanner/commit/a75e3367c28c8c01bc518b745b9984666e54acea))
* Find actual allocated secrets in logs ([29471a5](https://github.com/applandinc/scanner/commit/29471a5585f4114744381ec73e91320fe01d79b4))
* Refactor command printed output and exit status codes ([c6a134a](https://github.com/applandinc/scanner/commit/c6a134ac33cf95c00a80994421f26ecef6806755))

# [1.10.0](https://github.com/applandinc/scanner/compare/v1.9.0...v1.10.0) (2021-10-01)


### Features

* Scanner are classes with named fields ([2bce496](https://github.com/applandinc/scanner/commit/2bce4969c715e913430023e182e0369544bc85ca))

# [1.9.0](https://github.com/applandinc/scanner/compare/v1.8.0...v1.9.0) (2021-10-01)


### Features

* post commit status to GitHub ([5298ff2](https://github.com/applandinc/scanner/commit/5298ff24e7c1e5feec13a39365584ef181fa64e2))

# [1.8.0](https://github.com/applandinc/scanner/compare/v1.7.0...v1.8.0) (2021-09-30)


### Bug Fixes

* Match slow query if any include pattern matches ([1478b9a](https://github.com/applandinc/scanner/commit/1478b9a2d47867ef32621025cc492f0c5420e432))


### Features

* Scan for SQL update in GET/HEAD request ([e00a85e](https://github.com/applandinc/scanner/commit/e00a85e664f21ddfb6f1409633c556f324f4ee86))

# [1.7.0](https://github.com/applandinc/scanner/compare/v1.6.2...v1.7.0) (2021-09-29)


### Features

* Update GitHub token format ([e765624](https://github.com/applandinc/scanner/commit/e76562405c8a28c050297f3bb6c5b16f69704f84))

## [1.6.2](https://github.com/applandinc/scanner/compare/v1.6.1...v1.6.2) (2021-09-23)


### Bug Fixes

* replace ms with s ([83f0cf2](https://github.com/applandinc/scanner/commit/83f0cf20f615110c5c5ad6c265df98db0e250364))

## [1.6.1](https://github.com/applandinc/scanner/compare/v1.6.0...v1.6.1) (2021-09-23)


### Bug Fixes

* Update [@appmap](https://github.com/appmap) deps ([f2b1cda](https://github.com/applandinc/scanner/commit/f2b1cdac1b7c1a7bc40f6ad0a3752e7227d5225e))

# [1.6.0](https://github.com/applandinc/scanner/compare/v1.5.6...v1.6.0) (2021-09-22)


### Bug Fixes

* Change default assertions config to be .js ([58a9c4d](https://github.com/applandinc/scanner/commit/58a9c4d6421582a3119b1c36b9a61f5ab3978642))


### Features

* Pass state to VS Code links ([94efff9](https://github.com/applandinc/scanner/commit/94efff906a5e97aaeda896641381fec46c930d55))

## [1.5.6](https://github.com/applandinc/scanner/compare/v1.5.5...v1.5.6) (2021-09-21)


### Bug Fixes

* Fix path appmaps for IDE links ([3344d40](https://github.com/applandinc/scanner/commit/3344d405000d345563a79555d14b9c28ef1b01e0))

## [1.5.5](https://github.com/applandinc/scanner/compare/v1.5.4...v1.5.5) (2021-09-21)


### Bug Fixes

* Fix path to appmap's cli ([1f38306](https://github.com/applandinc/scanner/commit/1f383064541684f858d32d80557222a0c7a92c59))

## [1.5.4](https://github.com/applandinc/scanner/compare/v1.5.3...v1.5.4) (2021-09-21)


### Bug Fixes

* Revert bin path ([4d72f53](https://github.com/applandinc/scanner/commit/4d72f53d325896332a30f56ad2d324e6298b28ec))

## [1.5.3](https://github.com/applandinc/scanner/compare/v1.5.2...v1.5.3) (2021-09-21)


### Bug Fixes

* Fix hashbang ([325e4d6](https://github.com/applandinc/scanner/commit/325e4d6420c89de537bc11cedae3ef8a33d9ce45))

## [1.5.2](https://github.com/applandinc/scanner/compare/v1.5.1...v1.5.2) (2021-09-21)


### Bug Fixes

* Add executable with hashbang ([ab42f06](https://github.com/applandinc/scanner/commit/ab42f06605b2b0c740abbbf75cff714a4785eaa4))

## [1.5.1](https://github.com/applandinc/scanner/compare/v1.5.0...v1.5.1) (2021-09-21)


### Bug Fixes

* Fix bin path ([13bdc01](https://github.com/applandinc/scanner/commit/13bdc017e187a78e215da79f69e406972d78e44e))

# [1.5.0](https://github.com/applandinc/scanner/compare/v1.4.0...v1.5.0) (2021-09-20)


### Features

* Add summary by scanners ([a3e9465](https://github.com/applandinc/scanner/commit/a3e9465d095e41d82da855d1df35389beb4cea5e))

# [1.4.0](https://github.com/applandinc/scanner/compare/v1.3.0...v1.4.0) (2021-09-08)


### Features

* Rename 'failures' to 'matches' ([a1675a6](https://github.com/applandinc/scanner/commit/a1675a65ebf9b6a198113255624247a707aa3d7b))
* Write scanner results into AppMap index ([ed029bf](https://github.com/applandinc/scanner/commit/ed029bfb40826e4542f55c8a42daa1dbf2b11f56))

# [1.3.0](https://github.com/applandinc/scanner/compare/v1.2.0...v1.3.0) (2021-09-08)


### Bug Fixes

* Clarify the role of assertion config id ([d72493a](https://github.com/applandinc/scanner/commit/d72493accc711be1edf48a245df8ed71db3b25fb))


### Features

* Enable configuration of builtin scanners via YAML ([3f3cd16](https://github.com/applandinc/scanner/commit/3f3cd16d25d6dd4b2849eb4f26ab83ba6a00d2cd))
* Rename some scanners to better indicate the problem ([6338ab2](https://github.com/applandinc/scanner/commit/6338ab2ada1ae767b97dac4a031fa18b2c5fdb2d))
* typedef EventFilter ([3876792](https://github.com/applandinc/scanner/commit/3876792d09ea683c01efafcec34a367f74912fd9))

# [1.2.0](https://github.com/applandinc/scanner/compare/v1.1.0...v1.2.0) (2021-09-08)


### Bug Fixes

* Detect query from view as mvc.template label ([24e164f](https://github.com/applandinc/scanner/commit/24e164f776299bd0b4c90f5d12f14ea7019ba3e0))
* Don't report repated matches of N+1 query ([9105ac8](https://github.com/applandinc/scanner/commit/9105ac86a740637f02fcc5274af1cb7713408d44))
* Remove import of string from yargs ([4124d95](https://github.com/applandinc/scanner/commit/4124d95f675074fceb45988fe2bba0c67e9ba0e3))


### Features

* Add new scanners ([99430f2](https://github.com/applandinc/scanner/commit/99430f245db57cf5aa876dbfc8fb0d0c0e491326))
* Copy query normalization code from @appland/models ([5d49afb](https://github.com/applandinc/scanner/commit/5d49afbe60a8b0f02e7f996eb72ca6fac8d1c2e1))
* Ensure that certain events are leaf nodes ([4e9d15b](https://github.com/applandinc/scanner/commit/4e9d15b2f79ca097d6d8f42bc61e5d927632b664))
* Ensure that validate is called before save ([eb20b44](https://github.com/applandinc/scanner/commit/eb20b443dcb9c0cf154261c32f680a9e22e31454))
* N+1 query scanner ([b767024](https://github.com/applandinc/scanner/commit/b767024eda016519066daa24f0d609873c4aefe2))

# [1.1.0](https://github.com/applandinc/scanner/compare/v1.0.1...v1.1.0) (2021-09-07)


### Features

* Read configuration from yaml ([bc166f4](https://github.com/applandinc/scanner/commit/bc166f4dbed7dc4a7cbf7fd58c7d172c6bcac53f))

## [1.0.1](https://github.com/applandinc/scanner/compare/v1.0.0...v1.0.1) (2021-09-07)


### Bug Fixes

* Rename package to `scanners` ([1bd10cd](https://github.com/applandinc/scanner/commit/1bd10cd3bdf1310930a23ebdfec453aa9e700829))

# 1.0.0 (2021-09-07)


### Features

* Initial release ([cbea9f3](https://github.com/applandinc/scanner/commit/cbea9f38f5d7f612716a21a3fd7db342f889e88a))

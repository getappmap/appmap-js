# [@appland/models-v2.10.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.10.2...@appland/models-v2.10.3) (2024-06-08)


### Bug Fixes

* don't crash on bad AppMaps ([558c60a](https://github.com/getappmap/appmap-js/commit/558c60aa9fc6733a52de39f9ad64feeff9a74493))

# [@appland/models-v2.10.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.10.1...@appland/models-v2.10.2) (2024-04-24)


### Bug Fixes

* Unexpected return calls no longer raise an exception ([bccece5](https://github.com/getappmap/appmap-js/commit/bccece5a373e315d36ed2328dfbb1d22e20c7787))

# [@appland/models-v2.10.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.10.0...@appland/models-v2.10.1) (2024-03-04)


### Bug Fixes

* Limit recognition of a possible wildcard expression ([0ae2668](https://github.com/getappmap/appmap-js/commit/0ae266872f2c8bea86c2391b8a87d2fc649e0634))

# [@appland/models-v2.10.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.9.0...@appland/models-v2.10.0) (2023-12-21)


### Features

* Provide RPC methods for 'explain' ([6e0b1ff](https://github.com/getappmap/appmap-js/commit/6e0b1ff6fab447f0c3b34eceeddf513dba428087))

# [@appland/models-v2.9.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.8.0...@appland/models-v2.9.0) (2023-11-24)


### Bug Fixes

* Allow '*' only at the end of a filter name ([3c4d75d](https://github.com/getappmap/appmap-js/commit/3c4d75de1403c88e5e1a593276ee724074d2d976))


### Features

* Filter map around context events ([4e93cdf](https://github.com/getappmap/appmap-js/commit/4e93cdfa90d93833709ae2eec5a8c3a6af58eb05))
* Filter map around context events ([303dce4](https://github.com/getappmap/appmap-js/commit/303dce48a46ae370d4969cc02f060882477bfe65))

# [@appland/models-v2.8.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.7.0...@appland/models-v2.8.0) (2023-11-15)


### Features

* Recognize certain labeled functions as roots ([77de691](https://github.com/getappmap/appmap-js/commit/77de6912ca76f4d0ef5963ee5ecd4fb2f5ee7d34))

# [@appland/models-v2.7.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.5...@appland/models-v2.7.0) (2023-10-16)


### Features

* Cache parsed SQL to improve hash generation for events ([22a40c7](https://github.com/getappmap/appmap-js/commit/22a40c73cbbccd489b89c80c3c8d39c12eaeaa4f))
* Cache properties of events and code objects ([23c9470](https://github.com/getappmap/appmap-js/commit/23c9470b2fc50373071d4fe2474c3186adf4bd69))
* Only determine size of code objects if pruning ([1018e8d](https://github.com/getappmap/appmap-js/commit/1018e8d83a0b528a57cd7d48582d8aca8145085a))

# [@appland/models-v2.6.5](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.4...@appland/models-v2.6.5) (2023-09-25)


### Bug Fixes

* Metadata.exception is optional ([326cc59](https://github.com/getappmap/appmap-js/commit/326cc592620b6c6b5602a71f57babdd8bf046d9a))

# [@appland/models-v2.6.4](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.3...@appland/models-v2.6.4) (2023-07-26)


### Bug Fixes

* Fix problems in filter deserialization ([b5e0785](https://github.com/getappmap/appmap-js/commit/b5e0785e7d63fdc729518658ba7a4c8a17304fc7))
* Use sort() instead of localeCompare() ([f904763](https://github.com/getappmap/appmap-js/commit/f9047635c1a1282fbb819efddc136855314f10e0))

# [@appland/models-v2.6.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.2...@appland/models-v2.6.3) (2023-07-13)


### Bug Fixes

* consistent fqids for queries and (external) routes ([5f3e40e](https://github.com/getappmap/appmap-js/commit/5f3e40ead971f7a161890e7fd4c1c6da1fc192d9))

# [@appland/models-v2.6.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.1...@appland/models-v2.6.2) (2023-06-01)


### Bug Fixes

* can deserialize when hideExternal is a bool ([8596396](https://github.com/getappmap/appmap-js/commit/8596396b0123dc3251d610e8aedbb06f7f9da68c))

# [@appland/models-v2.6.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.6.0...@appland/models-v2.6.1) (2023-05-16)


### Bug Fixes

* serialize works for hide external ([145a64c](https://github.com/getappmap/appmap-js/commit/145a64c70a501d93097e637400986635bb038e31))

# [@appland/models-v2.6.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.5.0...@appland/models-v2.6.0) (2023-04-28)


### Bug Fixes

* Linter errors ([5353e0e](https://github.com/getappmap/appmap-js/commit/5353e0e6d09d07721a4c97575ce0f514b8270b56))
* Linter errors ([33b814e](https://github.com/getappmap/appmap-js/commit/33b814e45f8fb9a07e6cbe7497b9989dde1d335d))
* SQL parsing case where type is specified by variant is not ([d2456bf](https://github.com/getappmap/appmap-js/commit/d2456bfa069092d0bd5fbd482d2a8395ee1cfedf))


### Features

* Provide a global handler for SQL parse errors ([9f3a920](https://github.com/getappmap/appmap-js/commit/9f3a920347f7b29f07bfc2cdae33119edd62f5aa))
* Provide dependencyFolders for hideExternal filter ([e6869c6](https://github.com/getappmap/appmap-js/commit/e6869c6aaf421ccd2d0001fc662ed69842098000))
* Provide filter serialization in @appland/models ([35ed9c0](https://github.com/getappmap/appmap-js/commit/35ed9c0c5bf17e4239d6098ece5ea9b907472c3f))
* Provide hideTree filter ([0629db1](https://github.com/getappmap/appmap-js/commit/0629db195af754c8138fdbc95275058ca0e28a72))
* Write sql parse errors to a file ([a872190](https://github.com/getappmap/appmap-js/commit/a87219038c00227b5b7ce9bf1eb4c8fd5f5e7248))

# [@appland/models-v2.5.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.4.3...@appland/models-v2.5.0) (2023-04-19)


### Bug Fixes

* limitRootEvents filter should be a nop ([79bf3a1](https://github.com/getappmap/appmap-js/commit/79bf3a19ee2db9c73867bafb351dea478388c1f4))


### Features

* Support metadata.test_failure ([b4bf66e](https://github.com/getappmap/appmap-js/commit/b4bf66e10cfeff258cdbe7f4266ca5c3b2d95b00)), closes [/github.com/getappmap/appmap#v1120](https://github.com//github.com/getappmap/appmap/issues/v1120)

# [@appland/models-v2.4.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.4.2...@appland/models-v2.4.3) (2023-04-18)


### Bug Fixes

* more robust pruning ([8fb0366](https://github.com/getappmap/appmap-js/commit/8fb0366ae773d02f89e01df13320ffb747f55413))

# [@appland/models-v2.4.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.4.1...@appland/models-v2.4.2) (2023-03-31)


### Bug Fixes

* handle auto-prune when map already has pruneFilter ([2478528](https://github.com/getappmap/appmap-js/commit/24785289135ad80226f20c7fb273c9605cb448ab))

# [@appland/models-v2.4.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.4.0...@appland/models-v2.4.1) (2023-03-23)


### Bug Fixes

* Fix root objects and root HTTP filters ([c2e9dbd](https://github.com/getappmap/appmap-js/commit/c2e9dbdabff20c404f714d3c5d38fb53acf3633a))
* Optimize root objects filter ([f1bb820](https://github.com/getappmap/appmap-js/commit/f1bb8204f475c407c6cf88aa8efe4ad67223db97))

# [@appland/models-v2.4.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.3.0...@appland/models-v2.4.0) (2023-03-21)


### Features

* update prune cli command ([e6472ab](https://github.com/getappmap/appmap-js/commit/e6472ab8877fcded10c1a22927c43837f5793753))

# [@appland/models-v2.3.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.2.1...@appland/models-v2.3.0) (2023-03-16)


### Bug Fixes

* Cache RegExp for filter expressions ([68dcad9](https://github.com/getappmap/appmap-js/commit/68dcad9616a0d1edeeea3f7716d69f112d99d8de))


### Features

* Code name filter can be an explicit RegExp ([24ee58d](https://github.com/getappmap/appmap-js/commit/24ee58deb206f7c9bd2842fef9b616617c9cff5c))
* Filter out code from outside the source tree ([22dfb51](https://github.com/getappmap/appmap-js/commit/22dfb519e747eb4f3828a83ec392cebf8619f6c8))

# [@appland/models-v2.2.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.2.0...@appland/models-v2.2.1) (2023-03-15)


### Bug Fixes

* Add metadata.test_status and .location ([69d1a39](https://github.com/getappmap/appmap-js/commit/69d1a394186a261e0fbd64ce107a31366efab132))

# [@appland/models-v2.2.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.1.0...@appland/models-v2.2.0) (2023-02-24)


### Bug Fixes

* Linter error ([e9ce565](https://github.com/getappmap/appmap-js/commit/e9ce565d70244153d617d332b7d06b1675dbe7b3))


### Features

* Move AppMapFilter to @appland/models ([17ef95b](https://github.com/getappmap/appmap-js/commit/17ef95be62adb82222d4357b4d80e943e96abf7e))

# [@appland/models-v2.1.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v2.0.0...@appland/models-v2.1.0) (2023-02-10)


### Features

* Update ParameterProperty to AppMap spec v1.10.0 ([10ece88](https://github.com/getappmap/appmap-js/commit/10ece88487351b7078367905c559bd1b733d5ff5))

# [@appland/models-v2.0.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.23.2...@appland/models-v2.0.0) (2023-02-01)


### Bug Fixes

* Safely access CodeObject#location to prevent usage of undefined ([a4756a9](https://github.com/getappmap/appmap-js/commit/a4756a90747f2dfa8300050896a8e968b70fab2e))


### BREAKING CHANGES

* `CodeObject#location` is now marked as being
potentially undefined

# [@appland/models-v1.23.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.23.1...@appland/models-v1.23.2) (2023-01-25)


### Bug Fixes

* `http_server_response` `status_code` is no longer modified ([89c5a50](https://github.com/getappmap/appmap-js/commit/89c5a503049660163b971d22eeb0e0817e2ed61f))
* Allow writing of objects when serializing event properties ([b2b190a](https://github.com/getappmap/appmap-js/commit/b2b190ab30d7bffeb732085ceb93160639d7673b))

# [@appland/models-v1.23.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.23.0...@appland/models-v1.23.1) (2023-01-24)


### Bug Fixes

* Handle missing returnEvent ([347365a](https://github.com/getappmap/appmap-js/commit/347365a0d45f704a933c5f222f9b39c820a72193))

# [@appland/models-v1.23.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.22.0...@appland/models-v1.23.0) (2023-01-04)


### Features

* finding info in appmap ([ab75efb](https://github.com/getappmap/appmap-js/commit/ab75efb43710bf91ca98d0fe73bce12e859edcf5))

# [@appland/models-v1.22.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.21.0...@appland/models-v1.22.0) (2022-11-23)


### Features

* Emit OpenAPI schema for nested properties ([0a753a4](https://github.com/getappmap/appmap-js/commit/0a753a48e63b10cdfaa9197ca97dadfecbefe934))

# [@appland/models-v1.21.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.20.0...@appland/models-v1.21.0) (2022-10-29)


### Features

* Add external-route code objects ([b0c574e](https://github.com/getappmap/appmap-js/commit/b0c574eb6af09ec18d5712da7381ab0935f9fdc2))

# [@appland/models-v1.20.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.19.0...@appland/models-v1.20.0) (2022-09-27)


### Bug Fixes

* Don't crash if this.callEvent is undefined ([07a62b1](https://github.com/getappmap/appmap-js/commit/07a62b16a421bf490c522046675c3f154f7d94f3))
* for id and path, add a set property else we get the error: ([f48b75e](https://github.com/getappmap/appmap-js/commit/f48b75e9e6abcac38f706770693dcc3384325b21))
* no set for id,path; no $hidden in get path ([7f65e81](https://github.com/getappmap/appmap-js/commit/7f65e8138b642846aad1e800e4d3cfa2bd087830))
* no set for parent,id,path; no $hidden in get path ([d96584e](https://github.com/getappmap/appmap-js/commit/d96584ea219253abada273e7b58fec30b02c8d11))
* Stats works without get/set path ([474fcd3](https://github.com/getappmap/appmap-js/commit/474fcd340bb906ec977598c5799da97b51b79a8a))
* Stats works without set/get id. ([693d619](https://github.com/getappmap/appmap-js/commit/693d619252096104d0b396a6cc8a4da49e939570))
* use Event from @appland/models, and with new fields added in index.d.ts ([95870d5](https://github.com/getappmap/appmap-js/commit/95870d5e57340d8f49138dd9bb01f965e8d4c96e))


### Features

* Add properties on Event used by StatsCommand. ([4046382](https://github.com/getappmap/appmap-js/commit/404638279244e98d9a79acc30e449aae662e6c58))
* Export abstractSqlAstJSON ([917d847](https://github.com/getappmap/appmap-js/commit/917d8475ffadda93a36de85b0c1e9cd9bea96fea))
* Standardize 'identity' and 'stable' hash ([e671edf](https://github.com/getappmap/appmap-js/commit/e671edfda4f4ba595f2e538363bd1b21acea5ae9))

# [@appland/models-v1.19.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.18.3...@appland/models-v1.19.0) (2022-08-31)

### Features

- Add EventNavigator#following
  ([50858dd](https://github.com/getappmap/appmap-js/commit/50858ddc22239bccb6bb7b52be001efc35b4a06b))

# [@appland/models-v1.18.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.18.2...@appland/models-v1.18.3) (2022-08-29)

### Bug Fixes

- Handle null value case
  ([7230051](https://github.com/getappmap/appmap-js/commit/7230051851ad8e30f1425175769cf298380ae7cc))

# [@appland/models-v1.18.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.18.1...@appland/models-v1.18.2) (2022-08-16)

### Bug Fixes

- Make EventNavigator.preceding() actually work
  ([64507b8](https://github.com/getappmap/appmap-js/commit/64507b802f3f939d1dd7d61a1aa0a1cc00b1b021))

# [@appland/models-v1.18.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.18.0...@appland/models-v1.18.1) (2022-07-28)

### Bug Fixes

- Tweak stableProperties
  ([54f6ef2](https://github.com/getappmap/appmap-js/commit/54f6ef27ba535a717a33c829e76167f50a04e50b))

# [@appland/models-v1.18.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.17.0...@appland/models-v1.18.0) (2022-07-25)

### Features

- Add Event.stableProperties
  ([9db0ea4](https://github.com/getappmap/appmap-js/commit/9db0ea49cc60f438c576704d799ac9711625d254))

# [@appland/models-v1.17.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.16.2...@appland/models-v1.17.0) (2022-07-12)

### Features

- Externalized code object id and type
  ([d88b7cd](https://github.com/getappmap/appmap-js/commit/d88b7cd21635d42d437e296dd6338f093f392982))

# [@appland/models-v1.16.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.16.1...@appland/models-v1.16.2) (2022-06-24)

### Bug Fixes

- Emit missing data fields to JSON
  ([abf3de3](https://github.com/getappmap/appmap-js/commit/abf3de334f89432b2c7b36e02c7e4ce96e556128))

# [@appland/models-v1.16.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.16.0...@appland/models-v1.16.1) (2022-06-15)

### Bug Fixes

- Handle deep structures in EventNavigator.descendants
  ([a66d768](https://github.com/getappmap/appmap-js/commit/a66d768c913f4a84e2f5362b82dc1db629de0c1e))

# [@appland/models-v1.16.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.15.0...@appland/models-v1.16.0) (2022-06-08)

### Features

- Apply eventUpdates when building an AppMap
  ([9cf9989](https://github.com/getappmap/appmap-js/commit/9cf99891e1cdd46c8a58d3030c039ac75e2bce4f))

# [@appland/models-v1.15.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.5...@appland/models-v1.15.0) (2022-04-05)

### Features

- Add OpenAPI response schema by mime type
  ([fb96895](https://github.com/getappmap/appmap-js/commit/fb96895e071aaa010a43aaa53da7e5e480a590d8))

# [@appland/models-v1.14.5](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.4...@appland/models-v1.14.5) (2022-04-01)

### Bug Fixes

- remove credentials from git repository URLs
  ([#560](https://github.com/getappmap/appmap-js/issues/560))
  ([42cc0f9](https://github.com/getappmap/appmap-js/commit/42cc0f9043a9b2209a1343b2d019141c4044d491))

# [@appland/models-v1.14.4](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.3...@appland/models-v1.14.4) (2022-03-30)

### Bug Fixes

- Normalize HTTP server request path info
  ([#558](https://github.com/getappmap/appmap-js/issues/558))
  ([a130aac](https://github.com/getappmap/appmap-js/commit/a130aac0180600df94a7a4b570f25ec4fa4ecb51))

# [@appland/models-v1.14.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.2...@appland/models-v1.14.3) (2022-03-10)

### Bug Fixes

- Filter out package children when children are not selected by root
  ([#538](https://github.com/getappmap/appmap-js/issues/538))
  ([38698e5](https://github.com/getappmap/appmap-js/commit/38698e52d9e98c9f50ddaa23935347c2fd03e4f3))
- Normalize SQL strings with backslashes correctly
  ([715bd13](https://github.com/getappmap/appmap-js/commit/715bd13e6136d1496730f82d8a51da08702e7135))

# [@appland/models-v1.14.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.1...@appland/models-v1.14.2) (2022-03-01)

### Bug Fixes

- Update SQL parser
  ([8020ec3](https://github.com/getappmap/appmap-js/commit/8020ec3758e98f85d7fb36a040c444017ca98849))

# [@appland/models-v1.14.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.14.0...@appland/models-v1.14.1) (2022-02-12)

### Bug Fixes

- Update sql parser
  ([a69d0d1](https://github.com/getappmap/appmap-js/commit/a69d0d166793c3d7c369634bb07c021693831560))
- When normalizing SQL don't replace comments with a placeholder
  ([e3b2e03](https://github.com/getappmap/appmap-js/commit/e3b2e03f4b9a81cde39d419c98bc7cc41ab35ec7))

# [@appland/models-v1.14.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.13.0...@appland/models-v1.14.0) (2022-02-11)

### Bug Fixes

- Expect Content-Type header instead of mime_type field
  ([0886d8c](https://github.com/getappmap/appmap-js/commit/0886d8cf667e1b5b5325d26fd882a7586db29c25))

### Features

- Provide Event#requestContentType and #responseContentType
  ([31a6ff3](https://github.com/getappmap/appmap-js/commit/31a6ff37b53e2e58e5561a70a4417ec75416ef1a))

# [@appland/models-v1.13.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.12.1...@appland/models-v1.13.0) (2022-02-10)

### Features

- Upgrade SQL parser
  ([da5475e](https://github.com/getappmap/appmap-js/commit/da5475e47cb3943ea83c8380042178f7b289583f))

# [@appland/models-v1.12.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.12.0...@appland/models-v1.12.1) (2022-02-03)

### Bug Fixes

- Improved event hash
  ([5b14997](https://github.com/getappmap/appmap-js/commit/5b14997c53cc692f04dda50465e0933149daabbf))
- SQL event hash falls back on query normalization
  ([735e74c](https://github.com/getappmap/appmap-js/commit/735e74c1baaa7f3e369a3fbbcdf645de0f2fc73f))

# [@appland/models-v1.12.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.11.0...@appland/models-v1.12.0) (2022-02-03)

### Bug Fixes

- Specify event constructor type definition
  ([dacf26d](https://github.com/getappmap/appmap-js/commit/dacf26dc7b74d6bc0ba41fbea2ea17b18b01843a))

### Features

- Callback function on SQL parse error
  ([1ca4f53](https://github.com/getappmap/appmap-js/commit/1ca4f5314f8c0c82d6c37378517048a486426bdc))
- Refactor SQL utilities into @appland/models
  ([ef8a9be](https://github.com/getappmap/appmap-js/commit/ef8a9bebb08f08959272af24f8a8069514107681))

# [@appland/models-v1.11.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.10.1...@appland/models-v1.11.0) (2022-01-18)

### Features

- Port prune subcommand
  ([fd1d724](https://github.com/getappmap/appmap-js/commit/fd1d7240c2ce8d1fb3227713ab78a1a9761e14a5))

# [@appland/models-v1.10.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.10.0...@appland/models-v1.10.1) (2022-01-07)

### Bug Fixes

- descandants performs DFS traversal
  ([ae136cb](https://github.com/getappmap/appmap-js/commit/ae136cb669283534b9073e273f798ad0803e88ae))

# [@appland/models-v1.10.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.9.0...@appland/models-v1.10.0) (2022-01-05)

### Features

- Add detailed types for Metadata and SqliteParser
  ([2b74363](https://github.com/getappmap/appmap-js/commit/2b74363cbcecfa50bbc942a20c85da8d9af745d9))
- Use SqliteParser types
  ([75982aa](https://github.com/getappmap/appmap-js/commit/75982aab2c9a37aa254de50ef0e53c6b674ddbea))

# [@appland/models-v1.9.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.8.1...@appland/models-v1.9.0) (2021-12-14)

### Features

- Export type definitions
  ([bfee7ec](https://github.com/getappmap/appmap-js/commit/bfee7ec72ba63044dd82751c877b74348ebd8e88))

# [@appland/models-v1.8.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.8.0...@appland/models-v1.8.1) (2021-12-09)

### Bug Fixes

- Use @appland/sql-parser
  ([a9335a7](https://github.com/getappmap/appmap-js/commit/a9335a7273f54c6039875270c3ea11f5b57f2333))

# [@appland/models-v1.8.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.7.1...@appland/models-v1.8.0) (2021-12-06)

### Features

- Correctly parse some PostgreSQL-specific constructs
  ([52e0706](https://github.com/getappmap/appmap-js/commit/52e070676405ed4567b802a347f386fec4974651))

# [@appland/models-v1.7.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.7.0...@appland/models-v1.7.1) (2021-11-17)

### Bug Fixes

- Fix hash generation for events without parameters/labels
  ([703be7d](https://github.com/getappmap/appmap-js/commit/703be7d9cb8264c57202af2629179d9f2540deac))

# [@appland/models-v1.7.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.6.0...@appland/models-v1.7.0) (2021-11-11)

### Features

- expose function to build query AST
  ([29785e9](https://github.com/getappmap/appmap-js/commit/29785e91138182f9f927178b625be40da541d778))

# [@appland/models-v1.6.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.5.1...@appland/models-v1.6.0) (2021-11-01)

### Features

- Export parseNormalizeSQL and add joinsCount
  ([1f37628](https://github.com/getappmap/appmap-js/commit/1f37628e9c448176a0d068bd312ba4672e2f4925))

# [@appland/models-v1.5.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.5.0...@appland/models-v1.5.1) (2021-09-23)

### Bug Fixes

- add missing `elapsedTime` method to `Event`
  ([3f5b122](https://github.com/getappmap/appmap-js/commit/3f5b12274683a3f028151ef94f41f0f60827963c))

# [@appland/models-v1.5.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.4.0...@appland/models-v1.5.0) (2021-08-19)

### Features

- Add exceptions to Trace nodes ([#312](https://github.com/getappmap/appmap-js/issues/312))
  ([620d86d](https://github.com/getappmap/appmap-js/commit/620d86d446a9757e6d31b43b0587a5027a58528c))

# [@appland/models-v1.4.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.3.1...@appland/models-v1.4.0) (2021-08-17)

### Features

- Add global filters ([#217](https://github.com/getappmap/appmap-js/issues/217))
  ([3f16612](https://github.com/getappmap/appmap-js/commit/3f16612b7a876f94c81ca0414971c4c455b1a897))

# [@appland/models-v1.3.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.3.0...@appland/models-v1.3.1) (2021-07-30)

### Bug Fixes

- Move rollup dependencies to development
  ([7fbaae6](https://github.com/getappmap/appmap-js/commit/7fbaae69895307c1429ad764727d1f3bacd88181))

# [@appland/models-v1.3.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.2.0...@appland/models-v1.3.0) (2021-07-02)

### Bug Fixes

- Properly normalize 'pragma' query
  ([1f3b05d](https://github.com/getappmap/appmap-js/commit/1f3b05dbfd871e4446d5d2a8bfcf40474aedbb7f))
- Separately report query parse and analysis problems
  ([5121cb9](https://github.com/getappmap/appmap-js/commit/5121cb99809cf96b4f908c21419f22d60d01f841))

### Features

- Include event.depth property
  ([f1f8ee8](https://github.com/getappmap/appmap-js/commit/f1f8ee81ebea8b9e3b8783a22bc999219b1b2e50))
- Store the database_type in query classMap entries
  ([7a44af6](https://github.com/getappmap/appmap-js/commit/7a44af6504dc78574b3ba9eb5d1edb60d3124a44))

# [@appland/models-v1.2.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.1.0...@appland/models-v1.2.0) (2021-06-22)

### Bug Fixes

- Event#dataObjects was missing message objects from its return value
  ([ade2c31](https://github.com/getappmap/appmap-js/commit/ade2c31f316284a7232d914ba4fcec8b2c1ca4c7))
- Prevent access of non-array event messages
  ([15a9cc2](https://github.com/getappmap/appmap-js/commit/15a9cc2efce41451b83e2c35285de1644016fe3d))

### Features

- HTTP client requests
  ([0c0e833](https://github.com/getappmap/appmap-js/commit/0c0e8338d6d25bf11f73a17d035e2b424e670add))

# [@appland/models-v1.1.0](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.6...@appland/models-v1.1.0) (2021-06-16)

### Features

- Find and print info about a named function
  ([544db5c](https://github.com/getappmap/appmap-js/commit/544db5ca402d9e3399326f28da7d3a43a606f5c4))
- Test if an event is a regular function
  ([bb162d6](https://github.com/getappmap/appmap-js/commit/bb162d6b6431a4888872335c6eec5cf975b067bb))

# [@appland/models-v1.0.6](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.5...@appland/models-v1.0.6) (2021-06-03)

### Bug Fixes

- Optimize performance and behavior of ClassMap.bindEvents
  ([5bac5bd](https://github.com/getappmap/appmap-js/commit/5bac5bd90c1cc15ca05ff2d7920e9f17483f9dd4))

# [@appland/models-v1.0.5](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.4...@appland/models-v1.0.5) (2021-05-28)

### Bug Fixes

- Resolve an incorrect import of sha256 ([#227](https://github.com/getappmap/appmap-js/issues/227))
  ([fc64ff9](https://github.com/getappmap/appmap-js/commit/fc64ff981046b5e1732b088889202f32924c407d))

# [@appland/models-v1.0.4](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.3...@appland/models-v1.0.4) (2021-05-18)

### Bug Fixes

- Update local dependencies
  ([f0d3281](https://github.com/getappmap/appmap-js/commit/f0d328161499999ee98fbb3aec2d438b3095bd0f))

# [@appland/models-v1.0.3](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.2...@appland/models-v1.0.3) (2021-05-18)

### Bug Fixes

- Bundle ESM/CJS without external dependencies
  ([0a38ac0](https://github.com/getappmap/appmap-js/commit/0a38ac0a57baa30c6b0ff00bb69503e4891f8858))

# [@appland/models-v1.0.2](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.1...@appland/models-v1.0.2) (2021-05-11)

### Bug Fixes

- Add publish config
  ([118c54f](https://github.com/getappmap/appmap-js/commit/118c54f3db08f19de39bca7d67abd36a0071a20e))

# [@appland/models-v1.0.1](https://github.com/getappmap/appmap-js/compare/@appland/models-v1.0.0...@appland/models-v1.0.1) (2021-05-11)

### Bug Fixes

- Flag package as public
  ([67e179c](https://github.com/getappmap/appmap-js/commit/67e179cd72ba247903764de25d8c86e0dd07bf9b))

# @appland/models-v1.0.0 (2021-05-11)

### Features

- Initial release ([#195](https://github.com/getappmap/appmap-js/issues/195))
  ([c4776a0](https://github.com/getappmap/appmap-js/commit/c4776a0514c333746846b8ffca88465f8c2739ee))

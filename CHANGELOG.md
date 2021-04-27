## [2.3.4](https://github.com/applandinc/appmap-js/compare/v2.3.3...v2.3.4) (2021-04-27)


### Bug Fixes

* Remove padding from notification content panel ([fe3c3ec](https://github.com/applandinc/appmap-js/commit/fe3c3ecfed2c2b9f9b3f851f81fd062c6ffe61ee))

## [2.3.3](https://github.com/applandinc/appmap-js/compare/v2.3.2...v2.3.3) (2021-04-27)


### Bug Fixes

* Adjust notification bar to look more clickable ([#186](https://github.com/applandinc/appmap-js/issues/186)) ([73a4546](https://github.com/applandinc/appmap-js/commit/73a45461aa3fa00064544f7978dcd3e1305cfd0f))

## [2.3.2](https://github.com/applandinc/appmap-js/compare/v2.3.1...v2.3.2) (2021-04-26)


### Bug Fixes

* Fix missing tokens due to syntax highlighting ([#181](https://github.com/applandinc/appmap-js/issues/181)) ([cfd6672](https://github.com/applandinc/appmap-js/commit/cfd6672b0ae407824bbd1b2f6629e80da7475bf2))
* Normalize http_server_response status codes ([#184](https://github.com/applandinc/appmap-js/issues/184)) ([8aa490d](https://github.com/applandinc/appmap-js/commit/8aa490d7d2865a4e92c0a03498d883326094590a))
* Trace nodes blink when gaining focus from eye button ([#183](https://github.com/applandinc/appmap-js/issues/183)) ([089fa98](https://github.com/applandinc/appmap-js/commit/089fa98471d3fca6e13616d161d6dcb814fc0ff6))

## [2.3.1](https://github.com/applandinc/appmap-js/compare/v2.3.0...v2.3.1) (2021-04-26)


### Bug Fixes

* Revised notification banner and dropdown styling ([#185](https://github.com/applandinc/appmap-js/issues/185)) ([d856d01](https://github.com/applandinc/appmap-js/commit/d856d01c2bc324ef1a0c7925b95bacb2ee562465))

# [2.3.0](https://github.com/applandinc/appmap-js/compare/v2.2.0...v2.3.0) (2021-04-23)


### Features

* Add a notification bar API to VSCodeExtension ([#180](https://github.com/applandinc/appmap-js/issues/180)) ([6d16317](https://github.com/applandinc/appmap-js/commit/6d163177487668beb720fdf676527876fe5e178f))

# [2.2.0](https://github.com/applandinc/appmap-js/compare/v2.1.1...v2.2.0) (2021-04-22)


### Bug Fixes

* Don't drag contents of the extension when resizing ([af140df](https://github.com/applandinc/appmap-js/commit/af140dfe17be1e2912c75a477be1553534cef0ce))
* Lengthy label names in the dependency map are now trimmed ([#164](https://github.com/applandinc/appmap-js/issues/164)) ([f86a9b0](https://github.com/applandinc/appmap-js/commit/f86a9b02fcfef7c78cb90aa3602b44cc4d7b5675))
* Relax size constraints of the left panel ([1d05a9e](https://github.com/applandinc/appmap-js/commit/1d05a9e8a57a7983a4d995bd80826ce1e63ed466))


### Features

* Preview events without changing context in the details panel ([#168](https://github.com/applandinc/appmap-js/issues/168)) ([59e4951](https://github.com/applandinc/appmap-js/commit/59e49518d5625ab117ed2ba7b1f6bc7c6ed8b879))

## [2.1.1](https://github.com/applandinc/appmap-js/compare/v2.1.0...v2.1.1) (2021-04-21)


### Bug Fixes

* Deserializing extension state uses the filtered AppMap ([#177](https://github.com/applandinc/appmap-js/issues/177)) ([c9c07ee](https://github.com/applandinc/appmap-js/commit/c9c07ee9e27f44ca8b6b9e3cd466a7c0f8b34b0b))

# [2.1.0](https://github.com/applandinc/appmap-js/compare/v2.0.0...v2.1.0) (2021-04-21)


### Bug Fixes

* Depends base directory is now applied to input files ([e9c3ed7](https://github.com/applandinc/appmap-js/commit/e9c3ed7f000493f6061f535c511821cdb8c01d2a))
* Depends fields now only display text before the first colon ([c9a5162](https://github.com/applandinc/appmap-js/commit/c9a51628612acf2f34411c494668899c20267050))
* Depends now writes to stderr instead of stdout ([4d270e3](https://github.com/applandinc/appmap-js/commit/4d270e3514cc6c3b978d107b254d597f85945fc2))


### Features

* Depends now yields results as they occur ([7f47bfb](https://github.com/applandinc/appmap-js/commit/7f47bfb2954cbad16a9757c42b87cce0d6b1ea48))

# [2.0.0](https://github.com/applandinc/appmap-js/compare/v1.15.2...v2.0.0) (2021-04-20)


* refactor!: Merge state events (#173) ([07a22df](https://github.com/applandinc/appmap-js/commit/07a22df76528e31139f1c372b2833aeee54e7ba7)), closes [#173](https://github.com/applandinc/appmap-js/issues/173)


### Bug Fixes

* Highlight functions class on Dependency Map when function was selected in Trace view ([#167](https://github.com/applandinc/appmap-js/issues/167)) ([89521cb](https://github.com/applandinc/appmap-js/commit/89521cb9e4f9d3efc966c171ee3f83ee0aaa044d))
* Side panel scrollbar is now properly styled ([#163](https://github.com/applandinc/appmap-js/issues/163)) ([69edfde](https://github.com/applandinc/appmap-js/commit/69edfdec9a659938c05f473235930498fb81d2bc))


### Features

* Edges now link to both 'from' and 'to' events ([#166](https://github.com/applandinc/appmap-js/issues/166)) ([7a5364c](https://github.com/applandinc/appmap-js/commit/7a5364cf0eca48a0cbcf07e117cd9dc587d13543))


### BREAKING CHANGES

* Listeners of the `selectedObject` event should now listen for `stateChange` with data `selectedObject`.

## [1.15.2](https://github.com/applandinc/appmap-js/compare/v1.15.1...v1.15.2) (2021-04-14)


### Bug Fixes

* Stop panel resizing when cursor moves outside of app ([#162](https://github.com/applandinc/appmap-js/issues/162)) ([fd2275f](https://github.com/applandinc/appmap-js/commit/fd2275ff3d178f7bf16155da1ed8ec4fd15eea4a))

## [1.15.1](https://github.com/applandinc/appmap-js/compare/v1.15.0...v1.15.1) (2021-04-14)


### Bug Fixes

* Panel calculates window size during resize ([#161](https://github.com/applandinc/appmap-js/issues/161)) ([0df28af](https://github.com/applandinc/appmap-js/commit/0df28afef44a74b715f315669ae9b682c96429d7))

# [1.15.0](https://github.com/applandinc/appmap-js/compare/v1.14.0...v1.15.0) (2021-04-13)


### Features

* Show duplicate SQL queries as objects in details panel ([36fa10c](https://github.com/applandinc/appmap-js/commit/36fa10c070189e5bf02537b10c435625a0e9e62b))
* Show event count for items in the search result panel ([e008662](https://github.com/applandinc/appmap-js/commit/e00866297314450ad5ef0bdbb2f346494b923b0a))
* Split code objects to package/class/function sections in search panel ([59389c9](https://github.com/applandinc/appmap-js/commit/59389c93a5b245420687a70414c11517d8d6d4df))

# [1.14.0](https://github.com/applandinc/appmap-js/compare/v1.13.0...v1.14.0) (2021-04-13)


### Bug Fixes

* don't display 'View source' button for HTTP and SQL events ([0a7624e](https://github.com/applandinc/appmap-js/commit/0a7624ed2d2c8dd464b44277e7064d4fedf1d122))
* Don't display 'View source' button for HTTP and SQL events ([#155](https://github.com/applandinc/appmap-js/issues/155)) ([d316fda](https://github.com/applandinc/appmap-js/commit/d316fda8474e270c69029c2fc2b3d88c0d13a7f8))


### Features

* Expand and collapse packages by clicking on an icon within the ([39ebdc0](https://github.com/applandinc/appmap-js/commit/39ebdc0f80ffb85b1df17eec6524621e7677dd67))
* Expand and collapse packages by clicking on an icon within the node ([#156](https://github.com/applandinc/appmap-js/issues/156)) ([67b1cc7](https://github.com/applandinc/appmap-js/commit/67b1cc79d2f3ee057376e52db743509d4e1edf38))
* make details panel resizable ([46f0e6d](https://github.com/applandinc/appmap-js/commit/46f0e6db5501cd0f7308b5b79b205f4386a7d000))

# [1.13.0](https://github.com/applandinc/appmap-js/compare/v1.12.2...v1.13.0) (2021-04-12)


### Features

* Add an interface to serialize/deserialize VS Code extension state ([#157](https://github.com/applandinc/appmap-js/issues/157)) ([0db138f](https://github.com/applandinc/appmap-js/commit/0db138f894cbd5392601d888e8b8b8db64aaa596))

## [1.12.2](https://github.com/applandinc/appmap-js/compare/v1.12.1...v1.12.2) (2021-04-12)


### Bug Fixes

* add node labels in instructions legend ([e66ded1](https://github.com/applandinc/appmap-js/commit/e66ded109954b5eb0b23a38bf0b616f22f4f535b))
* change color for headers in instructions ([f620c3f](https://github.com/applandinc/appmap-js/commit/f620c3fdfe7e0b4898fbba993cef0dbfc14227a1))

## [1.12.1](https://github.com/applandinc/appmap-js/compare/v1.12.0...v1.12.1) (2021-04-08)


### Bug Fixes

* Zooming in and out when clicking the zoom buttons focuses on the selected object ([#150](https://github.com/applandinc/appmap-js/issues/150)) ([caaa7c0](https://github.com/applandinc/appmap-js/commit/caaa7c0b5e40d511c05b1fd7bf9fc758d602a0e2))

# [1.12.0](https://github.com/applandinc/appmap-js/compare/v1.11.3...v1.12.0) (2021-04-06)


### Bug Fixes

* Vue now properly loads Trace as a dynamic component ([9547a87](https://github.com/applandinc/appmap-js/commit/9547a870ba0a14b7799de6558624231af8cfa2e3))


### Features

* show app loader while AppMap data is loading ([7a85694](https://github.com/applandinc/appmap-js/commit/7a856949d4499ab37e0e83c043de8538a4979e6f))

## [1.11.3](https://github.com/applandinc/appmap-js/compare/v1.11.2...v1.11.3) (2021-04-06)


### Bug Fixes

* Remove an errant console.log statement ([#147](https://github.com/applandinc/appmap-js/issues/147)) ([89778b6](https://github.com/applandinc/appmap-js/commit/89778b64e24bb1bf09f484bdd1d977592390c030))

## [1.11.2](https://github.com/applandinc/appmap-js/compare/v1.11.1...v1.11.2) (2021-04-05)


### Bug Fixes

* Expose node bundle as `main` in package.json ([4fb9d28](https://github.com/applandinc/appmap-js/commit/4fb9d28fbc9f2959b91d3e17bcffd1512d1120f4))

## [1.11.1](https://github.com/applandinc/appmap-js/compare/v1.11.0...v1.11.1) (2021-04-05)


### Bug Fixes

* Filter non-root objects out of the UI ([71189f8](https://github.com/applandinc/appmap-js/commit/71189f8d456760810cf363b7532472fe1f939d4b))

# [1.11.0](https://github.com/applandinc/appmap-js/compare/v1.10.2...v1.11.0) (2021-04-02)


### Features

* Emit user events from the VS Code Extension ([fd6dfd1](https://github.com/applandinc/appmap-js/commit/fd6dfd18a25f1b69a6640ab04f6828fe401dfb27))

## [1.10.2](https://github.com/applandinc/appmap-js/compare/v1.10.1...v1.10.2) (2021-03-31)


### Bug Fixes

* make `isEmptyAppMap` property computed ([4c65a0c](https://github.com/applandinc/appmap-js/commit/4c65a0c144acf594fca43b487e19cf32541834cb))

## [1.10.1](https://github.com/applandinc/appmap-js/compare/v1.10.0...v1.10.1) (2021-03-29)


### Bug Fixes

* Improve instructions legibility ([#137](https://github.com/applandinc/appmap-js/issues/137)) ([62f5ea7](https://github.com/applandinc/appmap-js/commit/62f5ea7d6975f8cdb87d719db9bf32dca07f34c3))

# [1.10.0](https://github.com/applandinc/appmap-js/compare/v1.9.0...v1.10.0) (2021-03-24)


### Features

* Add API to set selectedObject from outside the app using FQID ([#128](https://github.com/applandinc/appmap-js/issues/128)) ([2a0f4b1](https://github.com/applandinc/appmap-js/commit/2a0f4b1bb0439ef6ef3055881adf6f290d9bfda5))

# [1.9.0](https://github.com/applandinc/appmap-js/compare/v1.8.0...v1.9.0) (2021-03-23)


### Bug Fixes

* don't show queries in parents list ([ed752dd](https://github.com/applandinc/appmap-js/commit/ed752dd974cb9186370c5a08b5a1f75a33baad61))


### Features

* add icon for codeObjects with type "route" ([7b57b31](https://github.com/applandinc/appmap-js/commit/7b57b31ff143739aadfce3cd5d60de5dcdd8495d))
* add icons for Database and Query objects ([6f28064](https://github.com/applandinc/appmap-js/commit/6f28064a46108b388cf0b8bfb0d4d21405ccc5f1))
* show class/function/event parents in Details panel ([5f900a2](https://github.com/applandinc/appmap-js/commit/5f900a20cf7bb69f0da35f28edfca10649f10054))

# [1.8.0](https://github.com/applandinc/appmap-js/compare/v1.7.0...v1.8.0) (2021-03-22)


### Features

* show notice when empty AppMap was opened ([88450ad](https://github.com/applandinc/appmap-js/commit/88450adebe39d33a15eaa7d136a92cab27a34223))
* styling for "no data" notice ([3ff1371](https://github.com/applandinc/appmap-js/commit/3ff13719f7bffabcc35f996a26db4d589822f6ba))

# [1.7.0](https://github.com/applandinc/appmap-js/compare/v1.6.0...v1.7.0) (2021-03-22)


### Features

* AppMap diffing and initial analysis framework ([8706913](https://github.com/applandinc/appmap-js/commit/87069130934e73ecab53db9883b9b90ff2c522ac))

# [1.6.0](https://github.com/applandinc/appmap-js/compare/v1.5.0...v1.6.0) (2021-03-22)


### Bug Fixes

* fix arrow aligning in instructions legend ([901d169](https://github.com/applandinc/appmap-js/commit/901d169f1b49cf688269af7680b137808614cca6))


### Features

* syntax highlight SQL ([#125](https://github.com/applandinc/appmap-js/issues/125)) ([8f87111](https://github.com/applandinc/appmap-js/commit/8f8711156ef536bc935a842e289106dda80dd5b1))

# [1.5.0](https://github.com/applandinc/appmap-js/compare/v1.4.0...v1.5.0) (2021-03-05)


### Features

* search and filter objects in default details panel ([#122](https://github.com/applandinc/appmap-js/issues/122)) ([9ea7bfe](https://github.com/applandinc/appmap-js/commit/9ea7bfee8b57c2fb2b331053507857d675958d0b))

# [1.4.0](https://github.com/applandinc/appmap-js/compare/v1.3.1...v1.4.0) (2021-03-05)


### Features

* keyboard navigation for Trace ([#120](https://github.com/applandinc/appmap-js/issues/120)) ([db2484f](https://github.com/applandinc/appmap-js/commit/db2484ff704a41b81f15f9c5f592a3b878f31a43))

## [1.3.1](https://github.com/applandinc/appmap-js/compare/v1.3.0...v1.3.1) (2021-03-02)


### Bug Fixes

* clear trace node highlight when clicking on diagram background ([647fe7d](https://github.com/applandinc/appmap-js/commit/647fe7de13596f67bd1c8fd1aea23fe5f223d0f6))

# [1.3.0](https://github.com/applandinc/appmap-js/compare/v1.2.0...v1.3.0) (2021-03-02)


### Features

* add support for event and code object labels ([26123ba](https://github.com/applandinc/appmap-js/commit/26123bae7a4924bf606871eb1e6363f28f063b02))

# [1.2.0](https://github.com/applandinc/appmap-js/compare/v1.1.2...v1.2.0) (2021-02-25)


### Bug Fixes

* use 'flex-start' value instead of 'start' for 'align-items' CSS property ([aea90fd](https://github.com/applandinc/appmap-js/commit/aea90fddc7cee12aa7385058c227cb3172742177))


### Features

* new tabs design ([c946f2c](https://github.com/applandinc/appmap-js/commit/c946f2c98d3da400ceb6df6cc4afb24d1be726c0))
* switch between tabs without re-render ([c862571](https://github.com/applandinc/appmap-js/commit/c8625719d1a735dcefb60761378cd0b35988f13f))

## [1.1.2](https://github.com/applandinc/appmap-js/compare/v1.1.1...v1.1.2) (2021-02-22)


### Bug Fixes

* prevent cut Trace nodes on small viewport ([4beb62f](https://github.com/applandinc/appmap-js/commit/4beb62fd51a371f6bf3476f4a9df5451fc52a434))

## [1.1.1](https://github.com/applandinc/appmap-js/compare/v1.1.0...v1.1.1) (2021-02-18)


### Bug Fixes

* drop babel from ESM bundle ([fdc9ccb](https://github.com/applandinc/appmap-js/commit/fdc9ccb6ec2258e17c75a89c82dba304e5611bbb))
* Trace retains esModule flag after transformation ([22bfc84](https://github.com/applandinc/appmap-js/commit/22bfc8446d55e43fc997e6859f82182654bd37d0))

# [1.1.0](https://github.com/applandinc/appmap-js/compare/v1.0.1...v1.1.0) (2021-02-17)


### Features

* interactive trace view ([#69](https://github.com/applandinc/appmap-js/issues/69)) ([69ad221](https://github.com/applandinc/appmap-js/commit/69ad2211d00f4c86a5c7308c6961a7fc17963a3f))

## [1.0.1](https://github.com/applandinc/appmap-js/compare/v1.0.0...v1.0.1) (2021-02-11)

### Bug Fixes

- component diagram is rendered properly
  ([ef48da7](https://github.com/applandinc/appmap-js/commit/ef48da75b0f7752bcde18f10e7c3e7c9eeb4e6c5))

## 0.2.6

- Fixed an issue where returning back to a function call could result in an
  infinite loop
- Packages now expand automatically when navigating through the details panel

## 0.2.5

- Expanded packages use their short name

## 0.2.4

- "View source" from the context menu properly propagates the view source event

## 0.2.3

- If a component diagram node is not associated with any events, don't render it
- Fix an issue where HTTP events in the trace view would not be named
  appropriately
- Expanding and collapsing a package will retain the highlight
- Now displaying package leafs instead of root level packages
- Fixed query links from a class opening an empty details panel
- Query events details no longer use the raw SQL as the title for the panel

## 0.2.2

- Selecting a function will no longer select all the classes in an expanded
  package

## 0.2.1

- Remove a visual artifact in trace nodes

## 0.2.0

- 'Reset view' can be selected from the context menu from anywhere in the
  viewport
- Packages are now visible when expanded
- Fix an issue where long vertical columns could cause the diagrams to center
  out of the visible space.
- Fix poppers not appearing in the flow view
- HTTP server responses are now visible in the event details panel

## 0.1.0

- Initial release of library

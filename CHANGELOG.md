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

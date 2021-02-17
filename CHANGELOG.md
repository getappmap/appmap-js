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

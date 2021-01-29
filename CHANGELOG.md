# Change Log

All notable changes to the "appmap" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how
to structure this file.

## [0.2.3]

- If a component diagram node is not associated with any events, don't render it
- Fix an issue where HTTP events in the trace view would not be named
  appropriately
- Expanding and collapsing a package will retain the highlight
- Now displaying package leafs instead of root level packages
- Fixed query links from a class opening an empty details panel
- Query events details no longer use the raw SQL as the title for the panel

## [0.2.2]

- Selecting a function will no longer select all the classes in an expanded
  package

## [0.2.1]

- Remove a visual artifact in trace nodes

## [0.2.0]

- 'Reset view' can be selected from the context menu from anywhere in the
  viewport
- Packages are now visible when expanded
- Fix an issue where long vertical columns could cause the diagrams to center
  out of the visible space.
- Fix poppers not appearing in the flow view
- HTTP server responses are now visible in the event details panel

## [0.1.0]

- Initial release of library

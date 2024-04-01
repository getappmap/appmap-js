---
layout: docs
title: Docs - Diagrams
description: "Improve your software engineering with AppMap's interactive sequence diagrams. Generate, view, compare, and export diagrams directly in your code editor for accurate, up-to-date documentation."
diagrams: true
name: Sequence Diagram
step: 4
redirect_from: [/docs/diagrams/sequence-diagrams]
---

# Sequence Diagram

> “A sequence diagram shows [process](https://en.wikipedia.org/wiki/Process_(computing)) interactions arranged in time sequence in the field of [software engineering](https://en.wikipedia.org/wiki/Software_engineering). It depicts the processes involved and the sequence of messages exchanged between the processes needed to carry out the functionality.“[^1]

The Sequence Diagram view shows an application's behavior in a linear chronological layout. Function calls are shown as horizontal arrows, ordered from top to bottom as they occurred at runtime. The elements in the sequence diagram are interactive and can be selected, collapsed, and hidden.

Sequence diagrams can also be exported as SVG files for easy sharing and collaboration. Similar AppMaps can also be compared in a sequence diagram "diff" to reveal changes in runtime behavior caused by a code update.

However, like all forms of documentation, a sequence diagram is only useful when it is current and accurate. AppMap gives you the ability to instantly generate sequence diagrams of any recorded program. A generated sequence diagram is accurate and easy to produce, and it can be re-created on demand. The sequence diagram format is described in the [UML standard](https://www.omg.org/spec/UML/).

You can use AppMap to view and interact with sequence diagrams of your application right in your code editor. AppMap can also generate sequence diagrams comparisons to make it easy to see the differences in runtime behavior caused by a coding change.

Sequence diagrams can be also exported as SVG images, or in popular text formats like PlantUML so that you can edit and share the diagrams however you prefer. AppMap sequence diagrams can also be generated on the command line, making it simple to use within a CI build to generate up-to-date sequence diagrams every time a change is made on your primary development branches.

## Viewing sequence diagrams in the code editor

The AppMap extensions for Visual Studio Code and JetBrains include support for viewing AppMaps as sequence diagrams. Simply open any AppMap and click on the `Sequence Diagram` tab to view it in the main editor window.

![Open sequence diagram](/assets/img/docs/find-sequence-diagram.webp "Open sequence diagram")

Sequence Diagrams follow these conventions:
1. Inbound HTTP server requests (if any) will be on the left hand side
2. Database queries and RPC requests (e.g. HTTP client requests) (if any) will be on the right hand side.
3. Each code package is represented as a sequence diagram “lifeline”. Each lifeline is a vertical lane which you can follow down the page.
4. Each function call is represented as a line from one lifeline to another.
5. The function return value (if any) will be depicted in the opposite direction.
6. If an AppMap contains HTTP server requests, other “root” events which are not HTTP server requests will be filtered out, by default.

Scrolling down within a sequence diagram in the editor retains the lifeline labels at the top, making it easy to keep track of which vertical line belongs to which entity. You can select function calls to see their details, or to see the same event in Trace View for even more detail.

### Removing lifelines from view

By default, AppMap Sequence Diagrams will contain "lifelines" for each of the actors in your application. If you would prefer not to see any of those, just click on the "X" within the lifeline label to remove it. This can be useful when hiding less important calls such as those to made a central logging package.

![Hide lifeline in sequence diagram](/assets/img/docs/hide-lifeline-sequence-diagram.webp "Hide lifeline in sequence diagram")

Lifelines that have been hidden can be re-shown using the "Filters" control, or by resetting the map using the "Clear" control.

![Show lifeline in sequence diagram](/assets/img/docs/show-lifeline-sequence-diagram.webp "Show lifeline in sequence diagram")

### Collapsing sections of a Sequence Diagram

Function calls that contain other events can be collapsed to make the diagram easier to read. This is done using the `[-]` control. 

![Collapse sequence diagram](/assets/img/docs/collapse-sequence-diagram.gif "Collapse sequence diagram")

Clicking on the `[+]` control will expand the same sequence set once again.

### Exporting sequence diagrams as SVG files

Sequence diagrams can be exported from the code editor as SVG image files. Any lifelines that are hidden from view will also not appear in the exported image.

To export a sequence diagram, click on `EXPORT` and the SVG data will appear in a new file in your project. Save that file to a desired location and then open it with a web browser or other suitable tool to view it.

![Export sequence diagram](/assets/img/docs/export-sequence-diagram.webp "Export sequence diagram")
![Save sequence diagram](/assets/img/docs/save-sequence-diagram.webp "Save sequence diagram")

## 3rd Party Integrations

Refer to the AppMap [integration documentation](/docs/integrations/plantuml) to learn more about how to integrate Sequence Diagrams with PlantUML and other 3rd party tools. 


### Notes

[^1]:
     [https://en.wikipedia.org/wiki/Sequence_diagram](https://en.wikipedia.org/wiki/Sequence_diagram) 
---
layout: docs
title: Docs - Guides
description: "Learn how to export your AppMap Diagrams into raw JSON format, SVG formats, and into 3rd party documentation tools like Confluence"
guides: true
name: Exporting AppMap Diagrams
step: 4
---

# Exporting AppMap Diagrams <!-- omit in toc -->

After generating AppMap Data, you can view this data inside your Code Editor.  But you may also want to share this data with other members of your team. This document will describe the options available for exporting AppMap Diagrams.

- [Export to JSON](#export-to-json)
- [Export to SVG (Sequence Diagrams Only)](#export-to-svg-sequence-diagrams-only)
- [Export to Atlassian Confluence](#export-to-atlassian-confluence)

## Export to JSON

The AppMap Diagram is a visual representation of the AppMap Data generated from your application. It is based on the open source [AppMap Data Specification](https://github.com/getappmap/appmap).  You can export your AppMap Data into this raw data format to share with other users.  When a user opens this `json` file in a code editor with the AppMap plugin installed, it will be rendered into the AppMap Visualizations. 

To export your AppMap Data into `json` , open your AppMap Diagram, and select the `Export` icon in the upper right corner of the AppMap. 

![Export Icon Location](/assets/img/docs/export-icon-location.webp)

Select the `JSON` option for export. This will open your local system's file explorer to the file containing the raw AppMap data. 

## Export to SVG (Sequence Diagrams Only)

SVG (Scalable Vector Graphics) is an XML-based vector image format for defining two-dimensional graphics.  AppMap utilizes this format to export Sequence Diagrams of your AppMap Diagram which can be viewed inside of any modern web browser.  

To export your Sequence Diagram into SVG, open your AppMap Diagram, and select the `Export` icon in the upper right corner of the AppMap. 

![Export Icon Location](/assets/img/docs/export-icon-location.webp)

Select the `SVG` option for export. This will convert your AppMap Sequence Diagram into an SVG file and open it as a new file within your code editor. 

![SVG Open in Code Editor](/assets/img/docs/open-svg-in-editor.webp)

Save the open file with an `.svg` extension and then open it in a web browser to view your AppMap Sequence Diagram.

![Open SVG in Web](/assets/img/docs/open-svg-in-web.webp)

## Export to Atlassian Confluence

AppMap integrates with [Confluence](https://www.atlassian.com/software/confluence), the popular corporate wiki developed by the Atlassian.

Confluence facilitates robust documentation and knowledge sharing. AppMap automatically generates interactive software diagrams from run-time data, ensuring an accurate and up-to-date understanding of code architecture and behavior. This integration leverages the strengths of both platforms enabling teams to better understand, document, and collaborate on their software projects.

Refer to the [AppMap Confluence integration docs](/docs/integrations/atlassian-confluence) to learn how to configure the AppMap Confluence App to support adding interactive AppMap Diagrams to Confluence documents. 
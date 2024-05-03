---
layout: docs
title: Docs - Integrations
description: "Generate, modify, and compare PlantUML sequence diagrams with AppMap. Integrate with tools like Atlassian Confluence. Ideal for code changes and GitHub Pull Requests."
integrations: true
name: PlantUML
step: 3
---

# PlantUML

AppMap can generate sequence diagrams in the PlantUML format, a textual format which is portable and easy to modify. This lets you integrate with other tools that support the Mermaid or PlantUML syntax. You can touch up the generated diagrams, and copy-paste the diagram text into a wide variety of tools that support the PlantUML format, such as Atlassian Confluence.

There are two ways to generate a PlantUML sequence diagram:

1. Run the `sequence-diagram` command with the option `--format plantuml`
1. Generate a sequence diagram from the code editor. Then locate the sequence diagram file in the file tree, and you’ll see a `<name>.sequence.uml` file.

You can copy the file contents directly into other tools, or you can customize it first like. If you are going to edit the PlantUML file, be sure and save it as a new file first.

### Generating sequence diagrams from the CLI

AppMap Data can be generated on the command line from your terminal, or within a CI build.

#### CLI command: `sequence-diagram`

You can generate sequence diagrams using the AppMap CLI command `sequence-diagram`.

An example:

```
$ appmap sequence-diagram --format plantuml tmp/appmap/minitest/Following_followers_page.appmap.json
```

### Comparing sequence diagrams

When two AppMap Diagrams are similar, it can be useful to represent them as sequence diagrams and then compare them. This is most useful:

1. To compare AppMap Diagrams of two different test cases, requests, or remote recordings.
1. To compare two different versions of the same AppMap - before and after a code change.

Sequence diagram comparisons can be attached to GitHub Pull Requests to make it easier for reviewers to better understand changes in code.

#### CLI command: `sequence-diagram-diff`

The `sequence-diagram-diff` command takes two diagram files as arguments, and produces a comparison file of the differences between them. For example: 

```
$ appmap sequence-diagram-diff --format plantuml user-search-1.sequence.json user-search-2.sequence.json
```

Note: this command takes sequence diagram files as arguments, not AppMap files. To convert an AppMap file to sequence diagram format, use this command:

```
$ appmap sequence-diagram -f json user-search-1.appmap.json
```

#### Comparing Sequence Diagrams in VS Code 

Download the PlantUML JAR file from [https://plantuml.com/download](https://plantuml.com/download)

Configure the file location:

<img class="video-screenshot" src="/assets/img/sequence-diagrams/plant-uml-location.png"/> 

<img class="video-screenshot" src="/assets/img/sequence-diagrams/compare.png"/> 

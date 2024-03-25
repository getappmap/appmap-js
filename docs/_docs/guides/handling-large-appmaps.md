---
layout: docs
title: Docs - Guides
guides: true
name: Handling Large AppMaps
step: 2
redirect_from: [/docs/reference/handling-large-appmaps]
---

# Handling Large AppMaps <!-- omit in toc -->

Some AppMaps contain too much data and can be difficult to review. Often, these AppMaps have many repetitive function calls that add a lot of data to the file, but don't add much value when interpreting the AppMap. Large AppMaps are a potential indication that you should change how you're recording by filtering out less valuable information. For example, you could exclude some calls to logging functions, or record fewer endpoints when manually recording.

- [AppMaps Over 10 MB](#appmaps-over-10-mb)
- [AppMaps Over 200 MB](#appmaps-over-200-mb)

## AppMaps Over 10 MB

When you attempt to open an AppMap in a code editor extension that is over 10 MB, it will be automatically pruned down to ~10 MB. The most frequently called functions will be removed until the file is below 10 MB in size. (Don't worry, the file will remain untouched because the pruning is done in memory).  You will see notifications within the AppMap informing you that it has been pruned, and the pruned functions will be highlighted in the Stats panel:

![Pruned Stats Panel](/assets/img/docs/pruned_stats_panel.webp)

The automatic pruning might be sufficient, but if you want more control over what events are removed, you have two options:

1. [Use the `prune` CLI command to remove events from an existing AppMap](/docs/reference/appmap-client-cli.html#prune)
2. Change the configuration of your `appmap.yml` to exclude certain events when an AppMap is generated
    * [Configure exclusions in a Ruby project](/docs/reference/appmap-ruby.html#configuration)
    * [Configure exclusions in a Java project](/docs/reference/appmap-java.html#configuration)
    * [Configure exclusions in a Python project](/docs/reference/appmap-python.html#configuration)
    * [Configure exclusions in a Node.js project](/docs/reference/appmap-node.html#configuration)

## AppMaps Over 200 MB

When an AppMap is over 200 MB, we will **not** open it in the code editor extension because it could cause performance issues on your computer. Instead, we generate statistics about your AppMap and open the Stats panel. Use this information to configure your `appmap.yml` to exclude these functions (see below). The next time that you generate your AppMap, it will be smaller because it will not contain the specified functions:

![Giant Map Stats Panel](/assets/img/docs/giant_map_stats_panel.jpg)

* [Configure exclusions in a Ruby project](/docs/reference/appmap-ruby.html#configuration)
* [Configure exclusions in a Java project](/docs/reference/appmap-java.html#configuration)
* [Configure exclusions in a Python project](/docs/reference/appmap-python.html#configuration)
* [Configure exclusions in a Node.js project](/docs/reference/appmap-node.html#configuration)

We do not recommend using the `prune` CLI command for AppMaps over 200 MB, because it loads the entire AppMap into memory, which may cause performance issues for your computer. 

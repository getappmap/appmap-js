---
layout: docs
title: Docs - Guides
description: "Learn how to manage large AppMap Diagrams effectively. Discover tips to handle AppMap Data over 10 MB and 200 MB in size, focusing on optimizing AppMap Data for better interpretation and performance."
guides: true
name: Handling Large AppMap Diagrams
step: 4
redirect_from: [/docs/reference/handling-large-appmaps, /docs/guides/handling-large-appmaps]
---

# Handling Large AppMap Diagrams <!-- omit in toc -->

Some AppMap Diagrams contain too much data and can be difficult to review. Often, these diagrams have many repetitive function calls that add a lot of data to the file, but don't add much value when interpreting the AppMap. Large AppMap Diagrams are a potential indication that you should change how you're recording by filtering out less valuable information. For example, you could exclude some calls to logging functions, or record fewer endpoints when manually recording.
 
- [AppMap Diagrams Over 10 MB](#appmap-diagrams-over-10-mb)
- [AppMap Diagrams Over 200 MB](#appmap-diagrams-over-200-mb)
- [Handle Large AppMap Diagrams in the CLI](#handle-large-appmap-diagrams-in-the-cli)
  - [Video Tutorial](#video-tutorial)

## AppMap Diagrams Over 10 MB

When you attempt to open an AppMap in a code editor extension that is over 10 MB, it will be automatically pruned down to ~10 MB. The most frequently called functions will be removed until the file is below 10 MB in size. (Don't worry, the file will remain untouched because the pruning is done in memory).  You will see notifications within the AppMap informing you that it has been pruned, and the pruned functions will be highlighted in the Stats panel:

![Pruned Stats Panel](/assets/img/docs/pruned_stats_panel.webp)

The automatic pruning might be sufficient, but if you want more control over what events are removed, you have two options:

1. [Use the `prune` CLI command to remove events from an existing AppMap](/docs/reference/appmap-client-cli.html#prune)
2. Change the configuration of your `appmap.yml` to exclude certain events when an AppMap is generated
    * [Configure exclusions in a Ruby project](/docs/reference/appmap-ruby.html#configuration)
    * [Configure exclusions in a Java project](/docs/reference/appmap-java.html#configuration)
    * [Configure exclusions in a Python project](/docs/reference/appmap-python.html#configuration)
    * [Configure exclusions in a Node.js project](/docs/reference/appmap-node.html#configuration)

## AppMap Diagrams Over 200 MB

When an AppMap Diagram is over 200 MB, we will **not** open it in the code editor extension because it could cause performance issues on your computer. Instead, we generate statistics about your AppMap and open the Stats panel. Use this information to configure your `appmap.yml` to exclude these functions (see below). The next time that you generate your AppMap, it will be smaller because it will not contain the specified functions:

![Giant Map Stats Panel](/assets/img/docs/giant_map_stats_panel.jpg)

* [Configure exclusions in a Ruby project](/docs/reference/appmap-ruby.html#configuration)
* [Configure exclusions in a Java project](/docs/reference/appmap-java.html#configuration)
* [Configure exclusions in a Python project](/docs/reference/appmap-python.html#configuration)
* [Configure exclusions in a Node.js project](/docs/reference/appmap-node.html#configuration)

We do not recommend using the `prune` CLI command for AppMap Diagrams over 200 MB, because it loads the entire AppMap into memory, which may cause performance issues for your computer. 

## Handle Large AppMap Diagrams in the CLI

For some AppMap Diagrams that are extraordinarily large, you may notice issues opening them in your code editor. 
In this scenario, you can use the AppMap CLI to analyze the statistics of the offending AppMap if you are unable to see the 
statistics in your code editor. 

You can then use the details from the `stats` command on the large AppMap to properly exclude functions that are noisy and may not provide any 
useful insights (for example getters and setters).

Here's how it works.

In this example, we have a specific test in our Python Django application that is generating a very large (over 1GB) AppMap.
We'll use the AppMap CLI to get information about the nosiest functions that we can exclude from a future AppMap recording.

![Large AppMap Diagrams](/assets/img/docs/guides/large-appmap-list.webp)

First, you'll need to ensure you have the AppMap CLI binaries installed on your machine.  
If you have already installed the AppMap code editor plugin for JetBrains or VS Code, the binaries will already exist 
in your `$HOME/.appmap/bin` directory. 

Otherwise, you can download the latest version of AppMap binaries on [GitHub following this guide.](/docs/reference/appmap-client-cli.html#install-appmap-cli-precompiled-binary)

With your binary installed.  We'll run the following command to analyze the large AppMap to identify noisy functions to exclude.

For more details about how the AppMap CLI works and the stats command, refer to the [AppMap reference guide.](/docs/reference/appmap-client-cli.html#stats)

In our command below, we'll run the stats command pointing to the directory where the AppMap lives, 
and the name of the appmap (the file extension `.appmap.json` can be optionally added or omitted).

```console
$ appmap stats <directory containing AppMap Data> --appmap-file <name of the AppMap Data file>
```
{: .example-code}

For example:

```bash
$ appmap stats tmp/appmap/pytest --appmap-file tests_integration_catalogue_test_category_TestMovingACategory_test_fix_tree.appmap.json
Analyzing AppMap: tmp/appmap/pytest/tests_integration_catalogue_test_category_TestMovingACategory_test_fix_tree.appmap.json

1. function:oscar/apps/catalogue/abstract_models/AbstractCategory#get_ancestors_and_self
      count: 1526529
      estimated size: 572.2 MB

2. function:oscar/apps/catalogue/abstract_models/AbstractCategory.fix_tree
      count: 1
      estimated size: 583.0 bytes

3. function:oscar/apps/catalogue/abstract_models/AbstractCategory#set_ancestors_are_public
      count: 1
      estimated size: 368.0 bytes
```
{: .example-code}

In our example the `get_ancestors_and_self` function in the `AbstractCategory` class is 
the single largest offender and the main cause of the large appmap.  

We will now add an exclusion for this function in our `appmap.yml` configuration file. 

To learn how to add an exclusion to your project refer to the documentation below.

* [Configure exclusions in a Ruby project](/docs/reference/appmap-ruby.html#configuration)
* [Configure exclusions in a Java project](/docs/reference/appmap-java.html#configuration)
* [Configure exclusions in a Python project](/docs/reference/appmap-python.html#configuration)
* [Configure exclusions in a Node.js project](/docs/reference/appmap-node.html#configuration)


In this example we'll exclude the `apps.catalogue.abstract_models.AbstractCategory.get_ancestors_and_self` function from 
our main `oscar` python package. 

My updated `appmap.yml` now looks like this:

```
appmap_dir: tmp/appmap
language: python
name: django-oscar
packages:
  - path: sandbox
  - path: oscar
    exclude: 
    - apps.catalogue.abstract_models.AbstractCategory.get_ancestors_and_self
```

Now if I run my tests again, this noisy function will no longer be included within the AppMap and the size of the file will 
be significantly reduced. 

![Smaller AppMap](/assets/img/docs/guides/smaller-appmap.webp)

### Video Tutorial

 {% include vimeo.html id='931215155' %}
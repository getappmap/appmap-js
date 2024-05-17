---
layout: docs
title: Docs - Reference
description: "Learn how to uninstall AppMap components like IDE plugins, libraries, and generated files from your project to clean up after usage effectively."
toc: true
reference: true
name: Uninstalling AppMap
step: 19
---

# Uninstalling AppMap
AppMap consists of several components, each of which may require a different uninstall approach depending on what changes were made to your applications during installation.

- [Uninstalling AppMap](#uninstalling-appmap)
  - [Uninstalling AppMap IDE Plugins](#uninstalling-appmap-ide-plugins)
    - [Uninstalling the AppMap VS Code Extension](#uninstalling-the-appmap-vs-code-extension)
    - [Uninstalling the AppMap JetBrains Plugin](#uninstalling-the-appmap-jetbrains-plugin)
  - [Removing AppMap libraries from your application](#removing-appmap-libraries-from-your-application)
    - [Ruby](#ruby)
    - [Java](#java)
    - [Python](#python)
  - [Removing AppMap-generated files from your project](#removing-appmap-generated-files-from-your-project)

## Uninstalling AppMap IDE Plugins

### Uninstalling the AppMap VS Code Extension
To uninstall AppMap from VS Code, first select the Extensions control to view your installed extensions. 
<img class="video-screenshot" src="/assets/img/docs/extensions-vsc.png"/>

Next, find and select `AppMap` in the list of installed extensions. Then click the `Uninstall` button to remove the AppMap extension from your editor.
<img class="video-screenshot" src="/assets/img/docs/uninstall-vsc.png"/>

Finally, if your project supports AppMap [Launch Configurations](https://appmap.io/docs/reference/vscode.html#run-with-appmap-for-java), you can now remove the AppMap specific details in the `.vscode/launch.json` and the `.vscode/settings.json` files. 

<img class="video-screenshot" src="/assets/img/docs/launch-configuration-uninstall.webp"/>

<p class="alert alert-info">
Please note that even after uninstalling the IDE extension, your project may still be configured to load an AppMap library and continue to record maps when your application is run. You should follow the language-specific uninstall instructions below to remove the AppMap library from your project.
</p>

### Uninstalling the AppMap JetBrains Plugin
To uninstall AppMap from JetBrains editors like IntelliJ and PyCharm, open your editor's `Settings` panel from the main menu. Select `Plugins` on the left panel, then find and select `AppMap` in the list of installed plugins. Then click the `Uninstall` button to remove the AppMap extension from your editor.
<p>
<img class="video-screenshot" src="/assets/img/docs/plugins-jetbrains.webp"/>
</p>

<p class="alert alert-info">
Please note that even after uninstalling the IDE plugin, your project may still be configured to load an AppMap library and continue to record maps when your application is run. You should follow the language-specific uninstall instructions below to remove the AppMap library from your project.
</p>

## Removing AppMap libraries from your application
Removing AppMap from your application typically involves removing the AppMap library from your project's dependencies. Language-specific instructions on how to do this are below.

### Ruby
Use the `bundle` command to remove the AppMap library from your project:

{: .example-code}

```console
$ bundle remove appmap
```

Or you can remove the appmap gem globally if installed at the system level. 

{: .example-code}

```console
$ gem uninstall appmap
```

Alternatively, manually remove the line containing `appmap` from the top of your Gemfile. 

### Java
For IntelliJ users, the act of uninstalling the AppMap plugin from the IDE is enough to fully remove AppMap configuration from your project. 

VS Code users should remove the AppMap launch commands from the files `launch.json` and `settings.json`, both located in the `.vscode` folder.

If you had also installed the [AppMap Maven plugin](https://appmap.io/docs/reference/appmap-maven-plugin.html), you should remove the appropriate AppMap `<plugin>` definition from your `pom.xml`. Similarly, if you had installed the [AppMap Gradle plugin](https://appmap.io/docs/reference/appmap-gradle-plugin.html#installation), you should remove the AppMap `plugins` section from your `build.gradle` or `build.gradle.kts` file.

### Python
Remove AppMap using your Python dependency manager:

{: .example-code}

```console
Using pip:
$ pip uninstall appmap

Using poetry:
$ poetry remove appmap

Using pipenv:
$ pipenv uninstall appmap
```

Also, if your project contains a `requirements.txt` file, you should remove `appmap` from that file too.

### Node.js
Your Node project dependencies were not modified to use AppMap. Simply changing your application's launch command
to no longer prepend `npx appmap-node` is enough to stop using AppMap.

## Removing AppMap-generated files from your project
If you had generated AppMap Data, you will have a number of files in your project folder that can safely be removed after completing the uninstall steps above. This is an optional step.

Start by removing the AppMap configuration file:

{: .example-code}

```console
$ rm appmap.yml
```

Finally, remove any generated AppMap files from your project:

{: .example-code}

```console
$ rm -r tmp/appmap
```

---
layout: docs
title: Docs - Reference
description: "Learn how to install AppMap components like IDE plugins, libraries in a secure or air-gapped network environment."
toc: true
reference: true
name: AppMap Offline Install for Secure Environments
step: 19
---

# AppMap Offline Install for Secure Environments

- [Assumptions](#assumptions)
- [Download Steps](#download-steps)
  - [Download the AppMap VS Code Plugin (VSIX)](#download-the-appmap-vs-code-plugin-vsix)
  - [Download the AppMap JetBrains Plugin (zip)](#download-the-appmap-jetbrains-plugin-zip)
  - [Download the AppMap Application Binaries](#download-the-appmap-application-binaries)
  - [Download the AppMap Java Jar file](#download-the-appmap-java-jar-file)
- [Installation Steps](#installation-steps)
  - [Install the AppMap VS Code Plugin (VSIX)](#install-the-appmap-vs-code-plugin-vsix)
  - [Install the AppMap Plugin for JetBrains (zip)](#install-the-appmap-plugin-for-jetbrains-zip)
  - [Install the AppMap Application Binaries for VS Code](#install-the-appmap-application-binaries-for-vs-code)
  - [Install the AppMap Application Binaries for JetBrains](#install-the-appmap-application-binaries-for-jetbrains)
  - [Install the AppMap Java Jar file](#install-the-appmap-java-jar-file)
- [Confirm Successful Installation](#confirm-successful-installation)

## Assumptions

Access to the following domains for downloading the AppMap application assets manually.

* [https://github.com/](https://github.com/)
  * For downloading the VS Code or JetBrains extension files
  * For downloading the AppMap application binaries
* [https://getappmap.com](https://getappmap.com)
  * To authenticate your VS Code installation
  * NOTE: This is only necessary if you don’t have AppMap provided license keys.

## Download Steps

### Download the AppMap VS Code Plugin (VSIX)

**If you are a JetBrains User, go to the [download documentation for the JetBrains plugin](#download-the-appmap-jetbrains-plugin-zip).**

Navigate to the the AppMap [VS Code GitHub latest releases page](https://github.com/getappmap/vscode-appland/releases/latest): 

This URL will take you to the most recently released version of the extension.  

Alternatively, you can navigate to [the main releases page](https://github.com/getappmap/vscode-appland/releases/) to install any specific version of the extension. 

Click on the VSIX file to save the file to your local machine. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-1.webp"/> 

### Download the AppMap JetBrains Plugin (zip)

Alternatively if you are a JetBrains user, navigate to the AppMap GitHub repository for the [JetBrains/IntelliJ plugin latest releases page](https://github.com/getappmap/appmap-intellij-plugin/releases/latest). 

Download the zip file and save locally. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-1b.webp"/> 

### Download the AppMap Application Binaries

Navigate to the [AppMap application binaries release page](https://github.com/getappmap/appmap-js/releases).  

Search within the page for a release with the name “@appland/appmap”.  

<img class="video-screenshot" src="/assets/img/docs/offline-install-2.webp"/> 

<div class="alert alert-info">NOTE: You may need to navigate to page 2 depending on the number of released AppMap binaries.</div>

Click on the “Assets” button to expand all the available AppMap binaries. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-3.webp"/> 

Download the binary that is specific to your computers’ operating system and architecture.  Optionally download the sha256 file as well if you wish to validate the files’ integrity on your local machine. 

### Download the AppMap Java Jar file

<div class="alert alert-info">NOTE: The VSIX will be bundled with the latest java jar file from the same release, but this is not guaranteed to be the same as the most recently released version. The steps below will ensure you can download the latest release if your machine is unable to manually update.</div>

To record Java applications, you’ll need to download the AppMap Java Jar file for the code editor extension to use.  
Navigate to the [AppMap Java releases page](https://github.com/getappmap/appmap-java/releases/latest) for the latest releases of this project.


In the Assets section, download the `appmap-<version>.jar` file and optionally the .asc file if you would like to validate the file integrity on your local machine. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-4.webp"/> 

## Installation Steps

### Install the AppMap VS Code Plugin (VSIX)

Open VS Code, and then open the Command Palette:
Mac: `Command + Shift + P`
Windows: `Control + Shift + P`

After opening the Command Palette, search for “install from VSIX”

<img class="video-screenshot" src="/assets/img/docs/offline-install-5.webp"/>

In the following window, locate the VSIX you downloaded previously and select that for installation.

<img class="video-screenshot" src="/assets/img/docs/offline-install-6.webp"/>

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Bullet Points</title>
  <style>
    .shifted-list {
      padding-left: 40px;
    }
  </style>
</head>
<body>
  <div class="alert alert-info">
    NOTE: If VS Code is able to connect to the following domains, AppMap binary asset download will complete successfully.  
    <ul class="shifted-list">
      <li>objects.githubusercontent.com</li>
      <li>*.github.com</li>
    </ul>
    If access to those URLs is blocked, continue to the “Install Application Binaries” steps below.
  </div>
</body>
</html>

### Install the AppMap Plugin for JetBrains (zip)

Open your JetBrains editor, and open the “Settings” page. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-7.webp"/>

The settings page should look similar to below.

<img class="video-screenshot" src="/assets/img/docs/offline-install-8.webp"/>

Search for, or select the “Plugins” option, then select the gear icon and choose “Install Plugin from Disk”

<img class="video-screenshot" src="/assets/img/docs/offline-install-9.webp"/>

Select the path to the zip file you [downloaded in the previous section](#download-the-appmap-jetbrains-plugin-zip).

After selecting the AppMap zip file, click “Accept” for the “Third-Party Plugins Notice”

<img class="video-screenshot" src="/assets/img/docs/offline-install-10.webp"/>

<div class="alert alert-info">Note: After clicking “Accept” to the JetBrains plugin notice you may need to go back to the previous “Install Plugin from Disk” step and repeat to install the plugin.</div>

When the plugin is successfully installed, you will see it in the settings page plugin list. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-11.webp"/>

If you don’t see it in the list, search for AppMap in the search box to confirm the installation is complete. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-12.webp"/>

After closing the settings page, the AppMap plugin will open.  

AppMap collects anonymous usage stats to improve the product, in the pop up on the bottom of the screen, choose to “Opt out” or simply close the popup to keep these anonymous product analytics enabled.

<img class="video-screenshot" src="/assets/img/docs/offline-install-13.webp"/>

<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Shift Bullet Points</title>
  <style>
    .shifted-list {
      padding-left: 40px; /* Adjust this value to shift more or less */
    }
  </style>
</head>
<body>
  <div class="alert alert-info">
    NOTE: If VS Code is able to connect to the following domains, AppMap binary asset download will complete successfully.  
    <ul class="shifted-list">
      <li>objects.githubusercontent.com</li>
      <li>*.github.com</li>
      <li>registry.npmjs.org</li>
    </ul>
    If access to those URLs is blocked, continue to the “Install Application Binaries” steps below.
  </div>
</body>
</html>

### Install the AppMap Application Binaries for VS Code

Copy the binary you downloaded in the [previous step](#download-the-appmap-application-binaries) to the following location.

#### On Mac and Linux  <!-- omit in toc -->

<pre><code>$HOME/.appmap/bin/appmap</code></pre>

The file needs to be made executable. You can run the following command.
<pre><code>chmod +x $HOME/.appmap/bin/appmap</code></pre>

#### On Windows  <!-- omit in toc -->

<pre><code>%USERPROFILE%\.appmap\bin\appmap.exe</code></pre>

### Install the AppMap Application Binaries for JetBrains

Copy the binary you downloaded in the [previous step](#download-the-appmap-application-binaries) and to the following location.

#### On Mac  <!-- omit in toc -->

<pre><code>$HOME/Library/Caches/JetBrains/appland-plugin/appmap/&lt;version&gt;/appmap-macos-arm64</code></pre>

Create the subdirectories if they don’t already exist. 

For example:

<pre><code>$HOME/Library/Caches/JetBrains/appland-plugin/appmap/3.164.0/appmap-macos-arm64</code></pre>

The file needs to be made executable. You can run the following command.

<pre><code>chmod +x $HOME/Library/Caches/JetBrains/appland-plugin/appmap/3.164.0/appmap-macos-arm64</code></pre>

#### On Linux  <!-- omit in toc -->

<pre><code>$HOME/.cache/JetBrains/appland-plugin/appmap/&lt;version&gt;/appmap-linux-arm64</code></pre>

Create the subdirectories if they don’t already exist. 

For example:

<pre><code>$HOME/.cache/JetBrains/appland-plugin/appmap/3.164.0/appmap-linux-arm64</code></pre>

The file needs to be made executable. You can run the following command

<pre><code>chmod +x $HOME/.cache/JetBrains/appland-plugin/appmap/3.164.0/appmap-linux-arm64</code></pre>

#### On Windows  <!-- omit in toc -->

<pre><code>%LocalAppData%\JetBrains\appland-plugin\appmap\&lt;version&gt;\appmap-win-x64.exe</code></pre>

Or the fully expanded path on windows.

<pre><code>C:\Users\&lt;YourUsername&gt;\AppData\Local\JetBrains\appland-plugin\appmap\&lt;version&gt;\appmap-win-x64.exe</code></pre>

Create the subdirectories if they don’t already exist. 

For Example: 

<pre><code>C:\Users\BobSmith\AppData\Local\JetBrains\appland-plugin\appmap\3.164.0\appmap-win-x64.exe</code></pre>

### Install the AppMap Java Jar file

Copy the <code>appmap-&lt;version&gt;.jar</code> downloaded in the [previous step](#download-the-appmap-java-jar-file) to the following location. Ensure the file is renamed to `appmap.jar`

#### On Mac and Linux  <!-- omit in toc -->

`$HOME/.appmap/lib/java/appmap.jar`

When recording your Java application, you will pass this file location to the JVM running your application like: 

`-javaagent:~/.appmap/lib/java/appmap.jar`

#### On Windows  <!-- omit in toc -->

`%USERPROFILE%\.appmap\lib\java\appmap.jar`

When recording your Java application, you will pass this file location to the JVM running your application like:
`-javaagent:%USERPROFILE%\.appmap\lib\java\appmap.jar`


## Confirm Successful Installation

After completing the install steps, you can confirm the installation was done correctly by doing the following:

### Open a Navie Chat 

Follow the [getting started instructions](/docs/using-navie-ai/how-to-open-navie) to open a new Navie chat window.  
If the AppMap binaries are installed and executable, you should see a new Navie chat window open sucessfully. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-14.webp"/>

If the binaries are not installed in the correct location, or are not exectuable, you will show a new Navie window prompt attempting to open but will hang until timeout. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-15.webp"/>

### Record a Java Application

To test your Java Jar file is in the right location and working correctly, simply record a java application using the Java command flag.  

Refer to the [AppMap Agent for Java](/docs/reference/appmap-java) documentation for more information about using the AppMap Jar for recording Java applications.

```shell
$ java -javaagent:$HOME/.appmap/lib/java/appmap.jar -jar target/*.jar
```
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

For best results, ensure you are downloading the latest versions of the AppMap software. 

We recommend running at least the following versions.

<table class="table table-striped table-bordered">
    <tr>
        <th></th>
        <th>Version Number</th>
    </tr>
    <tr>
        <td><b>VS Code Extension</b></td>
        <td><code>>= 0.130.0</code></td>
    </tr>
    <tr>
        <td><b>JetBrains Extension</b></td>
        <td><code>>= 0.74.1</code></td>
    </tr>
    <tr>
        <td><b>AppMap Binary</b></td>
        <td><code>>= 3.168.1</code></td>
    </tr>
    <tr>
        <td><b>(Optional) Java Jar</b></td>
        <td><code>>= 1.27.1</code></td>
    </tr>
</table>


- [Assumptions](#assumptions)
- [Download Steps](#download-steps)
  - [Download the AppMap VS Code Plugin (VSIX)](#download-the-appmap-vs-code-plugin-vsix)
  - [Download the AppMap JetBrains Plugin (zip)](#download-the-appmap-jetbrains-plugin-zip)
  - [Download the AppMap Application Binaries](#download-the-appmap-application-binaries)
- [Installation Steps](#installation-steps)
  - [Install the AppMap VS Code Plugin (VSIX)](#install-the-appmap-vs-code-plugin-vsix)
  - [Install the AppMap Plugin for JetBrains (zip)](#install-the-appmap-plugin-for-jetbrains-zip)
  - [Install the AppMap Application Binaries for VS Code](#install-the-appmap-application-binaries-for-vs-code)
  - [Install the AppMap Application Binaries for JetBrains](#install-the-appmap-application-binaries-for-jetbrains)
- [(Optional) Java Application Install Details](#optional-java-application-install-details)
  - [Download the AppMap Java Jar file](#download-the-appmap-java-jar-file)
  - [Install the AppMap Java Jar file](#install-the-appmap-java-jar-file)
- [Post-Installation Configuration](#post-installation-configuration)
  - [Configure the LLM Provider](#configure-the-llm-provider)
  - [Open a Navie Chat](#open-a-navie-chat)
  - [(Optional) Record a Java Application](#optional-record-a-java-application)
- [Troubleshooting](#troubleshooting)
  - [Accessing Navie Logs](#accessing-navie-logs)
    - [Visual Studio Code](#visual-studio-code)
    - [JetBrains](#jetbrains)
- [Support](#support)

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

## (Optional) Java Application Install Details

If you plan on using Navie with a Java application, follow the steps below to add the AppMap jar file to your local system to enable recording of AppMap data.

### Download the AppMap Java Jar file

<div class="alert alert-info">NOTE: The VSIX will be bundled with the latest java jar file from the same release, but this is not guaranteed to be the same as the most recently released version. The steps below will ensure you can download the latest release if your machine is unable to manually update.</div>

To record Java applications, you’ll need to download the AppMap Java Jar file for the code editor extension to use.  
Navigate to the [AppMap Java releases page](https://github.com/getappmap/appmap-java/releases/latest) for the latest releases of this project.


In the Assets section, download the `appmap-<version>.jar` file and optionally the .asc file if you would like to validate the file integrity on your local machine. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-4.webp"/> 

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

## Post-Installation Configuration

### Configure the LLM Provider

After completing the install steps, you can now [configure the LLM provider](/docs/using-navie-ai/bring-your-own-model.html) you wish to use with Navie. 

* [Integrate Navie with GitHub Copilot Backend](/docs/using-navie-ai/bring-your-own-model.html#using-github-copilot-language-models)
* [Bring Your Own OpenAI API Key](/docs/using-navie-ai/bring-your-own-model.html#bring-your-own-openai-api-key-byok)
* [Bring Your Own Anthropic (Claude) API Key](/docs/using-navie-ai/bring-your-own-model.html#bring-your-own-anthropic-claude-api-key-byok)
* [Bring Your Own Model](/docs/using-navie-ai/bring-your-own-model.html#bring-your-own-model-byom)

<div class="alert alert-info">If you have an existing subscription to GitHub Copilot, we recommend <a href="/docs/using-navie-ai/bring-your-own-model.html#using-github-copilot-language-models">using the GitHub Copilot backend </a> for best results.</div>

### Open a Navie Chat 

After configuring your chosen LLM provider, follow the [getting started instructions](/docs/using-navie-ai/how-to-open-navie) to open a new Navie chat window.  
If the AppMap binaries are installed and executable, you should see a new Navie chat window open successfully. 

<img class="video-screenshot" src="/assets/img/docs/offline-install-14.webp"/>

If the binaries are not installed in the correct location, or are not executable, the AppMap Navie RPC service will be unable to start.  In the event that happens, you can click "View output log" (on VS Code) to get more information about the failure. Alternatively, you can navigate to the [Navie logs](#accessing-navie-logs) for more information.

<img class="video-screenshot" src="/assets/img/docs/offline-install-15.webp"/>

### (Optional) Record a Java Application

To test your Java Jar file is in the right location and working correctly, simply record a java application using the Java command flag.  

Refer to the [AppMap Agent for Java](/docs/reference/appmap-java) documentation for more information about using the AppMap Jar for recording Java applications.

```shell
$ java -javaagent:$HOME/.appmap/lib/java/appmap.jar -jar target/*.jar
```

## Troubleshooting

### Accessing Navie Logs

#### Visual Studio Code

You can access the Navie logs in VS Code by opening the `Output` tab and selecting `AppMap Services` from the list of available output logs.  

To open the Output window, on the menu bar, choose View > Output, or in Windows press `Ctrl+Shift+U` or in Mac use `Shift+Command+U`

![Open View in VS Code](/assets/img/docs/vscode-output-1.webp)

Click on the output log dropdown in the right corner to view a list of all the available output logs. 

![Open Output logs list](/assets/img/docs/vscode-output-2.webp)

Select on the `AppMap: Services` log to view the logs from Navie. 

![Select AppMap Services](/assets/img/docs/vscode-output-3.webp)

#### JetBrains

You can enable debug logging of Navie in your JetBrains code editor by first opening `Help` > `Diagnostic Tools` > `Debug Log Settings`. 

![JetBrains Debug Log menu](/assets/img/jetbrains-debug-logs.webp)  

In the `Custom Debug Log Configuration` enter `appland` to enable DEBUG level logging for the AppMap plugin. 

![JetBrains Debug Log Configuration](/assets/img/jetbrains-logging-configuration.webp)  

Next, open `Help` > `Show Log...` will open the IDE log file. 

![JetBrains Debug Show Log](/assets/img/jetbrains-show-log.webp)

## Support

For help with your offline install of AppMap Navie, please open a new support request by emailing [support@appmap.io](mailto:support@appmap.io)

Include the following information in your support request.

* Company Name
* Code editor name and version (e.g. VS Code or JetBrains)
* AppMap binary version
* Detailed log information available [from your Navie logs](#accessing-navie-logs)
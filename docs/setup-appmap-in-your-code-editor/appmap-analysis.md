---
layout: docs
title: Docs - AppMap in your Code Editor
description: "AppMap Runtime Analysis scans AppMap Data to detect code flaws, presenting findings in your editor for preemptive fixes."
name: AppMap Analysis
setup-appmap-ide: true
step: 8
redirect_from: [/docs/your-first-15-minutes-with-appmap/appmap-analysis,/docs/analysis/in-your-code-editor,/docs/analysis/]
---

# AppMap Analysis

When there is AppMap Data available in your project, AppMap Runtime Analysis will immediately scan them to detect flaws in the code. These flaws are surfaced as **findings** and are displayed in your code editor as you work so that they can be addressed **before** they are propagated to test or production environments.

## Navigate findings

AppMap makes information about findings available in two main locations:

- [The **Runtime Analysis** step of the setup instructions](#the-runtime-analysis-step-of-the-setup-instructions)
- [The **Runtime Analysis** sidebar pane](#the-runtime-analysis-sidebar-pane)

### The **Runtime Analysis** step of the setup instructions

#### Visual Studio Code
<image class="video-screenshot" src="/assets/img/docs/last-step-of-setup-instructions.webp"/> 

#### JetBrains editors
<image class="video-screenshot" src="/assets/img/docs/last-step-of-setup-instructions-jetbrains.webp"/> 

### The **Runtime Analysis** sidebar pane

In Visual Studio Code, findings are displayed In the Runtime Analysis sidebar pane sorted by impact category and type.

<image class="video-screenshot" src="/assets/img/docs/runtime-analysis-sidebar-findings.webp"/> 

Clicking the ‘Overview’ link in the Runtime Analysis sidebar will open the ‘Runtime Analysis Summary’ window which contains a summary of findings for a particular project.

<image class="video-screenshot" src="/assets/img/docs/runtime-analysis-overview-dashboard.webp"/> 

{% include vimeo.html id='916087872' %}

---

**In this video**  
AppMap Analysis scans your AppMap Data to find software design flaws that impact performance, stability, security and maintainability. This runtime code analysis can find the problems that static code analyzers miss - and that cause 90% of today’s most serious production issues.

**Links mentioned**  
[AppMap Community Slack](/slack)  
[Get AppMap for VSCode](https://marketplace.visualstudio.com/items?itemName=appland.appmap)  
[Get AppMap for JetBrains](https://plugins.jetbrains.com/plugin/16701-appmap)

---

## Follow along

AppMap Analysis is available for both JetBrains IDEs and Visual Studio Code. 

## Investigate findings

Let's look at a sample Ruby on rails application, where AppMap has already been installed and AppMap Data has been generated. From the test cases, you'll see a new option for findings in the left-hand column or an option here for investigate findings.

<img class="video-screenshot" src="/assets/img/appmap-analysis-1.webp"/>

You can see one of the issues we've found is that a log event contained secret data by clicking on the finding will be taken directly to the line of code where this event occurs by hovering over the pin.
<img class="video-screenshot" src="/assets/img/appmap-analysis-2.webp"/>

## Use labels to visually explore your code

You can open the AppMap and see exactly where the function wrote this secret to a log file. How does AppMap know that this was a secret? Unlike static analyzers and other tools that do pattern matching AppMap knows this function generates secrets because we have built in knowledge of common software libraries with pre-populated labels.

We know exactly where to look to avoid false positives. Developers can extend their labels, whether it's a common library or not with simple code comments on their functions.
<img class="video-screenshot" src="/assets/img/appmap-analysis-3.webp"/>

If you search for the secret label, you'll see the location in the code where this event occurs by clicking on the function, you'll be taken to the exact location of the AppMap, where the secret was generated. Additionally, you can open the code, combining a visual model alongside the code.
<img class="video-screenshot" src="/assets/img/appmap-analysis-4.webp"/>

**Next step: [Join the AppMap Community](/community)**

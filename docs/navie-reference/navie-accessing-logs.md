---
layout: docs
title: Docs - Reference
name: Accessing Navie Logs
toc: true
step: 7
navie-reference: true
description: "Reference Guide to AppMap Navie AI, how-to guide for accessing logs."
---


# Accessing Navie Logs

## Visual Studio Code

You can access the Navie logs in VS Code by opening the `Output` tab and selecting `AppMap Services` from the list of available output logs.  

To open the Output window, on the menu bar, choose View > Output, or in Windows press `Ctrl+Shift+U` or in Mac use `Shift+Command+U`

![Open View in VS Code](/assets/img/docs/vscode-output-1.webp)

Click on the output log dropdown in the right corner to view a list of all the available output logs. 

![Open Output logs list](/assets/img/docs/vscode-output-2.webp)

Select on the `AppMap: Services` log to view the logs from Navie. 

![Select AppMap Services](/assets/img/docs/vscode-output-3.webp)

## JetBrains

You can enable debug logging of Navie in your JetBrains code editor by first opening `Help` > `Diagnostic Tools` > `Debug Log Settings`. 

![JetBrains Debug Log menu](/assets/img/jetbrains-debug-logs.webp)  

In the `Custom Debug Log Configuration` enter `appland` to enable DEBUG level logging for the AppMap plugin. 

![JetBrains Debug Log Configuration](/assets/img/jetbrains-logging-configuration.webp)  

Next, open `Help` > `Show Log...` will open the IDE log file. 

![JetBrains Debug Show Log](/assets/img/jetbrains-show-log.webp)
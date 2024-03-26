---
layout: docs
title: Docs - AppMap Navie
name: How to use Navie
step: 3
navie: true
toc: true
---

# How to Use Navie

When you ask a question to Navie, it will search through all your AppMaps created for your project to pull in relevant traces, sequence diagrams, and code snippets for analysis.  It will then send these code snippets and runtime code sequence diagrams to the Generative AI service along with your question.  By sending this valuable context to the AI interface, your answers will be much more personal and specific to your codebase, files, and functions. Additionally, the Generative AI will be able to understand how your code works at runtime and will be able to make architectural level recommendations across your entire application. 

- [How to Open Navie](#how-to-open-navie)
  - [In VS Code](#in-vs-code)
  - [In JetBrains](#in-jetbrains)
- [How to Generate the Highest Quality Answers](#how-to-generate-the-highest-quality-answers)
  - [Create AppMaps](#create-appmaps)
  - [Ask Navie](#ask-navie)
  - [Write Code](#write-code)
  - [Repeat](#repeat)
- [Next Steps](#next-steps)

## How to Open Navie

There are three ways to access Navie in your code editor:
- [How to Open Navie](#how-to-open-navie)
  - [In VS Code](#in-vs-code)
    - [In the AppMap Plugin Instructions Section](#in-the-appmap-plugin-instructions-section)
    - [Via the VS Code Command Palette](#via-the-vs-code-command-palette)
    - [Select a code block and use the lightbulb](#select-a-code-block-and-use-the-lightbulb)
  - [In JetBrains](#in-jetbrains)
    - [In the AppMap Sidebar Plugin](#in-the-appmap-sidebar-plugin)
    - [Via the JetBrains Tools menu option](#via-the-jetbrains-tools-menu-option)
- [How to Generate the Highest Quality Answers](#how-to-generate-the-highest-quality-answers)
  - [Create AppMaps](#create-appmaps)
  - [Ask Navie](#ask-navie)
  - [Write Code](#write-code)
  - [Repeat](#repeat)
- [Next Steps](#next-steps)

### In VS Code

#### In the AppMap Plugin Instructions Section

You can Ask Navie by opening the AppMap Instructions drop down and select on the "Ask AppMap Navie AI".

<img class="video-screenshot" src="/assets/img/product/navie-navigation.webp"/> 

#### Via the VS Code Command Palette

You can open the VS Code Command Palette
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

And search for `Navie`

<img class="video-screenshot" src="/assets/img/product/command-palette-navie.webp"/> 

#### Select a code block and use the lightbulb

Finally you can open Navie by selecting a block of text and using the lightbulb to ask Navie about your code.

<img class="video-screenshot" src="/assets/img/product/lightbulb.webp"/> 

### In JetBrains

#### In the AppMap Sidebar Plugin

You can open the AppMap plugin in your sidebar.

<img class="video-screenshot" src="/assets/img/product/appmap-sidebar.webp"/> 

Then select Ask AppMap Navie AI from the Instructions section.

<img class="video-screenshot" src="/assets/img/product/ask-navie-vscode.webp"/>

#### Via the JetBrains Tools menu option

You can open Navie by clicking on the JetBrains menu option `Tools` -> `AppMap`.  From there you can select `Explain with AppMap Navie AI`

<img class="video-screenshot" src="/assets/img/product/tools-appmap-vscode.webp"/>

AppMap Navie will open as a new tab in your JetBrains editor. 

<img class="video-screenshot" src="/assets/img/product/ask-navie-vscode-window.webp"/>

## How to Generate the Highest Quality Answers

To generate the highest quality responses from Navie, we recommend the following approach. 
  
- [Create AppMaps](#create-appmaps)
- [Ask Navie](#ask-navie)
- [Write Code](#write-code)
- [Repeat](#repeat)

### Create AppMaps

We recommend creating maps that are most relevant to the question or area of the application you are going to be working with. For example, if i wanted to understand how my new user registration flow worked I could [create a remote recording](/docs/setup-appmap-in-your-code-editor/generate-appmaps-with-remote-recording) of a new user registration flow. Alternatively, I could [run all the test cases](/docs/setup-appmap-in-your-code-editor/generate-appmaps-from-tests) related to new user creation, registration, and adjacent areas. 

Depending on your language and framework there [are up to 5 different ways](/docs/setup-appmap-in-your-code-editor/how-appmap-works.html#recording-methods) that you can record AppMaps for your application.

1. **[Test Case Recording](/docs/setup-appmap-in-your-code-editor/generate-appmaps-from-tests.html)**: This method is particularly useful for automated testing environments. AppMap integrates with numerous testing frameworks, creating individual AppMaps for each test case run. These AppMaps include detailed information such as the test framework, test case names, and their outcomes, enabling a comprehensive overview of test coverage and facilitating easier debugging and performance optimization.

2. **[Requests Recording](/docs/setup-appmap-in-your-code-editor/generate-appmaps-with-request-recording)**: Ideal for web applications, this method records each HTTP request processed by your application. By simply running your application with the AppMap agent and interacting with it—either manually or through automated scripts—you can generate a rich dataset of AppMaps that capture the full scope of your application's request handling.

3. **[Remote Recording](https://appmap-io-pr-1253.onrender.com/docs/setup-appmap-in-your-code-editor/generate-appmaps-with-remote-recording)**: Similar to request recording but offering more control over the recording session. You initiate and stop recording via HTTP commands, allowing the inclusion of multiple requests and other non-HTTP activities within a single AppMap. This method is particularly suited for capturing detailed interactions within web applications, including background jobs and other processes.

4. **Code Block Recording**: Provides the highest level of control, enabling you to specify exactly which blocks of code to record by inserting simple code snippets. This method requires source code access and is a powerful option for targeting specific functionalities or debugging complex issues. (Code Block recording is language specific, refer to [the language reference docs for examples](/docs/reference)).

5. **Process Recording**: A broader approach that records all activity within the configured scope of your application, from startup to shutdown. This method is useful when other methods are not applicable or when you need a comprehensive capture of your application's behavior. (Process recording is language specific, refer to [the language reference docs for examples](/docs/reference)).

Each of these methods generates AppMaps in JSON format, which are then visualized through interactive diagrams in your code editor. This visualization supports a deep understanding of your application's architecture, dependencies, and runtime behavior, facilitating enhanced code quality and performance optimization.

### Ask Navie

Navie, can address a wide range of questions about your application, extending beyond what static analysis AI assistants can provide, to understand dynamic interactions, dependencies, and performance bottlenecks to help your developers design and deliver solutions faster for a host of complex issues.

AppMap includes Dynamic Code Analysis rules which can be customized to flag specific code issues. Refer [to the AppMap rules reference](/docs/reference/analysis-rules) for a complete list of issues that can be identified.

**Examples of good questions to ask Navie.**

* Why is `behavior X` happening in dev and not in production?
* Why did the `feature x` return a 500 error?
* How can I make `feature x` use the database more efficiently?
* What can I do to optimize the queries on this page?
* Where does user registration happens in my code base? 
* Provide a solution to add Google OAuth login support for my user login pages. 
* Explain what functions or files are involved when a user logs into my service. 
* Loading the "products" view page is slow in production, provide suggested guidance with relevant code changes I can make to improve the speed.

### Write Code

Navie can do more than just provide code implementation details, you can talk to Navie about a variety of other topics as you are updating your application based on it's recommendations. 

1. **Identifying Components**: Navie can search through your AppMaps to highlight the files, methods, and external services interacting during the registration process, offering runtime sequence diagrams for clarity.

2. **Implementation Guidance**: After identifying the areas of interest, you might need specific implementation advice. For instance, where and how to integrate third-party libraries into your existing codebase. Navie can provide detailed instructions on modifying settings files, updating URL configurations, and extending forms with new functionalities.

3. **Debugging and Optimization**: Beyond initial implementation, Navie can assist in debugging by pointing out potential sources of errors or inefficiencies in the code paths triggered during user interactions.

4. **Comparative Analysis and Recommendations**: By analyzing the runtime behavior and execution flow, Navie can offer recommendations to enhance performance, improve security, or reduce technical debt, backed by the rich data context of your application's actual operations.

5. **Custom Queries**: Tailor your questions to fit unique development needs—whether you're troubleshooting a specific error, seeking optimization opportunities, or curious about the interactions between various components of your application.

### Repeat

Continue to ask follow-up question to Navie as you are making code changes or when you need additional details or more specific advice.  Additionally, as you make changes to your application, continue recording AppMaps of the updated code interactions and start new conversations with Navie to dive deeper into your feature implementation. 

## Next Steps

Watch: [Demo of using AppMap Navie to add a new feature to a complex application.](/docs/navie/demo)
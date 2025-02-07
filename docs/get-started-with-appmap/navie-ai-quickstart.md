---
layout: docs
setup-appmap-ide: true
title: Docs - AppMap in your Code Editor
description: "Learn how AppMap Navie AI works: Ask Navie architectural level questions about your code and use AppMap Data as"
step: 2
name: Navie AI Quickstart
redirect_from: [/docs/setup-appmap-in-your-code-editor/navie-ai-quickstart]
---

# AppMap Navie AI Quickstart

- [Choose your AI Provider (Optional)](#choose-your-ai-provider-optional)
- [Open AppMap Navie AI](#open-appmap-navie-ai)
- [Ask Navie about your App](#ask-navie-about-your-app)
- [Improve Navie AI Responses with AppMap Data](#improve-navie-ai-responses-with-appmap-data)
- [Next Steps](#next-steps)

## Choose your AI Provider (Optional)

By default, Navie uses the GitHub Copilot LLM.

If you aren't using Copilot, or if you would like to use your own LLM API key or local LLM, you can use a variety of other AI model providers such as OpenAI, Anthropic, Gemini, Fireworks.ai, LM Studio, and more. View the
instructions for [Choosing an LLM Provider](/docs/using-navie-ai/choose-llm-provider) for more details.

## Open AppMap Navie AI

After you complete the installation of AppMap for your code editor. Open the Navie Chat Window to ask Navie about your application.

To open the Navie Chat, open the AppMap plugin in the sidebar menu for your code editor, and select the `New Navie Chat` option.

![Open Navie](/assets/img/open-navie.webp)

## Ask Navie about your App

You can ask questions about your application with Navie immediately after installing the plugin. Navie will answer questions based on analysis of your project code. For increased accuracy of more complex projects, you can record AppMap data and Navie will utilize this information as well.

When you ask a question to Navie, it will search through all the available AppMap data for your project to pull in relevant traces, sequence diagrams, and code snippets for analysis. It will send the selected context to your preferred LLM provider.

To achieve the highest quality results, we suggest using the available command modes when prompting Navie. Simply type `@` into the chat input to access the list of available command modes.

By default, Navie chat is in a default mode called `@explain`. Other specialized modes are available for generating diagrams, planning work, generating code and tests, and more. Consult [Navie commands documentation](/docs/using-navie-ai/navie-commands.html) for more details.

The Navie UI includes a standard chat window, and a context panel which will include all the context that is included in the query to the AI provider. This context can include things such as:

**Always available:**

- Code Snippets
- Pinned Content

<p class="alert alert-warning"><b>Note:</b> Only code files and other files that are tracked by Git will be included as context and sent to the LLM when you ask a question. AppMap Navie will respect your <code>.gitignore</code> and will not access files which are not tracked or ignored by Git (such as passwords or sensitive data).</p>

**If AppMap Data exists:**

- Sequence Diagrams
- HTTP Requests
- SQL Queries
- Other I/O Data

**Navie will look for the files listed above in the following locations:**

- The currently open project
- All workspace folders in Visual Studio Code
- All modules available in JetBrains IDEs

![Navie Context Window](/assets/img/navie-context-window.webp)

## Improve Navie AI Responses with AppMap Data

Generate AppMap Data and you will greatly improve the quality of your Navie AI responses. With AppMap Data for your project, you can now ask much deeper architectural questions about your application. This is possible because of the additional context from AppMap Data and the higher accuracy and relevance of the code snippets which are relevant to your question.

View the [Navie AI examples page](/product/examples/navie) to see some examples of Navie fixing complex architectural issues, performance issues, and adding new features to your application.

After your AppMap Data is generated, the Navie window will indicate the AppMap Data that exists for your project.

![Navie AppMap Data Exists](/assets/img/navie-appmap-data-exists.webp)

With this AppMap Data in your project, asking questions to Navie will now include data flows, sequence diagrams, traces, in addition to the relevant code snippets for the project.

![Navie AppMap context window 2](/assets/img/navie-appmap-context-window.webp)

## Next Steps

Continue to ask questions to Navie, creating new code for your application, and continue to generate additional AppMap Data as your code changes. On each subsequent question asked, Navie will re-query your AppMap Data, traces, data flows, and source code for your project to power the context for the answer.

[Learn more about making AppMap Data to improve Navie response accuracy](/docs/get-started-with-appmap/making-appmap-data)

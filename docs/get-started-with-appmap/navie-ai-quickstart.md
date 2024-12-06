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
- [Using Navie with JetBrains IDEs + Corporate-provided Github Copilot LLM Backend](#using-navie-with-jetbrains-ides--corporate-provided-github-copilot-llm-backend)
- [Next Steps](#next-steps)

## Choose your AI Provider (Optional)

By default, Navie uses an AppMap proxy of the latest OpenAI supported AI models. If you would like to customize your own model, you can leverage a variety of other AI model providers such as [Azure OpenAI](https://appmap.io/docs/navie-reference#azure-openai), [Fireworks.ai](https://appmap.io/docs/navie-reference#fireworks-ai), [LM Studio](https://appmap.io/docs/navie-reference#lm-studio), and more.  

If you have an active GitHub Copilot subscription, you can use Navie with the [Copilot Language Model](/docs/navie-reference/navie-bring-your-own-model-examples.html#github-copilot-language-model) as a supported backend. Refer to the [Navie Copilot documentation](/docs/navie-reference/navie-bring-your-own-model-examples.html#github-copilot-language-model) for instructions on how to enable.

## Open AppMap Navie AI

After you complete the installation of AppMap for your code editor. Open the Navie Chat Window to ask Navie about your application. 

To open the Navie Chat, open the AppMap plugin in the sidebar menu for your code editor, and select the `New Navie Chat` option.

![Open Navie](/assets/img/open-navie.webp)

## Ask Navie about your App

You can ask questions about your application with Navie immediately after installing the plugin. Navie will answer questions based on analysis of your project code. For increased accuracy of more complex projects, you can record AppMap data and Navie will utilize this information as well.

By default, Navie will utilize an OpenAI service hosted by AppMap. If, for data privacy or other reasons, you are do not wish to use the AppMap OpenAI proxy, you can [bring your own OpenAI API key](/docs/using-navie-ai/bring-your-own-model.html#bring-your-own-openai-api-key-byok), or use an [entirely different AI Model](/docs/using-navie-ai/bring-your-own-model.html#ollama), hosted in your environment or hosted locally.

When you ask a question to Navie, it will search through all the available AppMap data for your project to pull in relevant traces, sequence diagrams, and code snippets for analysis. it will send the selected context to your preferred LLM provider.

To achieve the highest quality results, we suggest using the available command modes when prompting Navie. Simply type `@` into the chat input to access the list of available command modes.

By default, Navie chat is in a default mode called `@explain`. Other specialized modes are available for generating diagrams, planning work, generating code and tests, and more. Consult [Using Navie docs](/docs/navie-reference/navie-commands.html) for more details on Navie commands.

The Navie UI includes a standard chat window, and a context panel which will include all the context that is included in the query to the AI provider.  This context can include things such as:

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

## Using Navie with JetBrains IDEs + Corporate-provided GitHub Copilot LLM backend

Organizations that must use Copilot language models and primarily use JetBrains IDEs, such as IntelliJ, must install AppMap in both IntelliJ and Visual Studio Code to access the full features of AppMap's Navie AI Software Architect. This setup allows you to toggle between the two environments and integrate AI capabilities into your development tools.

AppMap Navie, backed by GitHub Copilot language models, is exclusively available within the Visual Studio Code.

![IntelliJ with Corporate Backend Diagram](/assets/img/docs/intellij-with-corp-copilot-backend.png)

### Step-by-Step Installation Instructions for using JetBrains IDEs with Corporate-provided GitHub Copilot LLM backend


**Visual Studio Code Setup**

<ol>
  <li>Install Visual Studio Code </li>
  <li>Install Copilot in Visual Studio Code </li>
  <li>Install AppMap in Visual Studio Code</li>
<li>Sign in to AppMap using your corporate email address. AppMap Navie will connect to Copilot automatically. If you don’t see a message confirming this, try reloading the window or contact AppMap support at <a href="mailto:support@appmap.io">support@appmap.io</a>.</li>
  <li>Open your project in Visual Studio Code. Confirm that your code is visible in Visual Studio Code in the Workspace / Explorer View.</li>
</ol>

**JetBrains IDE Setup**

<ol start="6">
  <li>Install the AppMap plugin for JetBrains</li>
  <li>Sign in to AppMap using your company email address</li>
</ol>

**Make AppMap Data to enhance the responses of Navie AI**

<ol start="8">
  <li><a href="https://appmap.io/docs/get-started-with-appmap/making-appmap-data.html">Make AppMap Observability Data (if desired).</a></li>
  <li> After making AppMap data, confirm that AppMap data files are available in the AppMap plugin panel</li>
</ol>

**Use Navie AI in Visual Studio Code**

<ol start="10">
  <li>Return to Visual Studio Code</li>
  <li>Open the AppMap sidebar panel, confirm that AppMap data files are visible</li>
  <li>Open Navie using the “New Navie Chat” button, or run the command “AppMap: Ask Navie AI”
    <img src="/assets/img/docs/navie-from-the-command-window.png" alt="Navie from the command window in Visual Studio Code"/>
    </li>
  <li>Ask Navie a question or request a diagram of your code.</li>
  <li>Select some code in a code editor, then open Navie. You’ll be chatting about the selected code.</li>
  <li>Drag and drop a file into a Navie chat, while using the Shift key. You’ll be chatting about the selected file. It can also contain prompt information, such as instructions that you want Navie to follow.</li>
</ol>

**Clean Up**

When you are done with a task, run “Delete All AppMaps” from the command window.
<img src="/assets/img/docs/delete-all-appmaps-command.png" alt="Delete all AppMaps command in Visual Studio Code"/>  

Keep the AppMap data in your workspace focused on the task that you are working on. This will ensure that Navie references the most recent and relevant information available. 


## Next Steps

Continue to ask questions to Navie, creating new code for your application, and continue to generate additional AppMap Data as your code changes.  On each subsequent question asked, Navie will re-query your AppMap Data, traces, data flows, and source code for your project to power the context for the answer. 

[Learn more about making AppMap Data to improve Navie response accuracy](/docs/get-started-with-appmap/making-appmap-data)
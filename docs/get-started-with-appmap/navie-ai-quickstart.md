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

- [Open AppMap Navie AI](#open-appmap-navie-ai)
- [Ask Navie about your App](#ask-navie-about-your-app)
- [Improve Navie AI Responses with AppMap Data](#improve-navie-ai-responses-with-appmap-data)
- [Next Steps](#next-steps)

## Open AppMap Navie AI

After you complete the installation of AppMap for your code editor. Open the Navie Chat Window to ask Navie about your application. 

To open the Navie Chat, open the AppMap plugin in the sidebar menu for your code editor, and select the `New Navie Chat` option.

![Open Navie](/assets/img/open-navie.webp)

## Ask Navie about your App

You can ask questions about your application with Navie immediately after installing the plugin.  AppMap Data is not required but Navie only has partial information about your project and the answers will not include any runtime specific information. 

By default, Navie will utilize an OpenAI service hosted by AppMap. If, for data privacy or other reasons, you are do not wish to use the AppMap OpenAI proxy, you can [bring your own OpenAI API key](/docs/navie/bring-your-own-model.html#bring-your-own-openai-api-key-byok), or use an [entirely different AI Model](/docs/navie/bring-your-own-model.html#ollama), hosted in your environment or hosted locally.

When you ask a question to Navie, it will search through all your AppMap Diagrams (if they exist) for your project to pull in relevant traces, sequence diagrams, and code snippets for analysis. It will then send these code snippets and runtime code sequence diagrams to the Generative AI service along with your question. 

Refer to the [Using Navie docs](/docs/navie/using-navie) to learn more about the advanced Navie chat commands you can use with your question. 

After asking Navie a question, Navie will search through your application source code, finding any relevant code snippets. It will include relevant AppMap Data like sequence diagrams and data flows if they exist for your project. You will see on the right hand side of the Navie window the relevant context from your code included with the question. 

The Navie UI includes a standard chat window, and a context panel which will include all the context that is included in the query to the AI provider.  This context can include things such as:

**Always available:**  
- Code Snippets

**If AppMap Data exists:**  
- Sequence Diagrams
- HTTP Requests
- SQL Queries
- Other I/O Data

![Navie Context Window](/assets/img/navie-context-window.webp)

## Improve Navie AI Responses with AppMap Data

Generate AppMap Data and you will greatly improve the quality of your Navie AI responses. With AppMap Data for your project, you can now ask much deeper architectural questions about your application. This is possible because of the additional context from AppMap Data and the higher accuracy and relevance of the code snippets which are relevant to your question. 

View the [Navie AI examples page](/product/examples/navie) to see some examples of Navie fixing complex architectural issues, performance issues, and adding new features to your application.

After your AppMap Data is generated, the Navie window will indicate the AppMap Data that exists for your project. 

![Navie AppMap Data Exists](/assets/img/navie-appmap-data-exists.webp)

With this AppMap Data in your project, asking questions to Navie will now include data flows, sequence diagrams, traces, in addition to the relevant code snippets for the project. 

![Navie AppMap context window 2](/assets/img/navie-appmap-context-window.webp)

## Next Steps

Continue to ask questions to Navie, creating new code for your application, and continue to generate additional AppMap Data as your code changes.  On each subsequent question asked, Navie will re-query your AppMap Data, traces, data flows, and source code for your project to power the context for the answer. 

[Learn more about making AppMap Data to improve Navie response accuracy](/docs/get-started-with-appmap/making-appmap-data)
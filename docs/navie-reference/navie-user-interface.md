---
layout: docs
title: Docs - Reference
name: Navie User Interface
step: 11
navie-reference: true
description: "Reference Guide to AppMap Navie AI, describing the user interface."
---

## User Interface
AppMap Navie AI is an AI assistant that enables you to ask architectural level questions about your code base. Navie is also able to help you generate new code that can span across your entire project. The primary user interface for Navie is within your VS Code or JetBrains code editor.  Refer to the Navie docs to [learn how to open Navie](/docs/using-navie-ai/how-to-open-navie) for your code editor. 

![Navie User Interface](/assets/img/docs/appmap-navie-user-interface.webp)

### Basic Layout

The Navie user interface consists of 5 key areas. 

<ol type="A">
  <b><li>AppMap Data Status Panel</li></b>
  This panel will list the current status of the AppMap Data that has been created for your project.  AppMap Data are your application runtime traces which include things like HTTP and SQL requests, data flows, class and function level instrumentation, and more. Without AppMap Data created for your project, Navie can search through your static source code in your workspace for relevant code snippets. 
  <b><li>Navie Context Window</li></b>
  Upon asking a question to Navie it will search through your AppMap Data (if exists) and the source code in your open workspace to locate all the relevant context for your question. This area will reflect the information that Navie is aware of when answering. You can use this information to better understand how Navie is responding.
  <b><li>LLM Model Config Button</li></b>
  You can configure Navie to use your own OpenAI API key or bring your own LLM model running locally or within another provider. Clicking the gear icon will open the configuration modal for the bring your own model settings.  <a href="/docs/using-navie-ai/bring-your-own-model">Refer to the AppMap docs for more details</a>
 about how to configure Navie to use your own LLM models. 
  <b><li>Active LLM Model</li></b>
  This panel will display the currently configured LLM model in use with Navie.  The LLM details are displayed in the following format: <code>Model: &lt;Model Name&gt; (&lt;location&gt;)</code>.  When using the default Navie backend, the location will be listed as <code>default</code>. When using your own OpenAI API key the location will be listed as <code>via OpenAI</code>.  When using <a href="/docs/using-navie-ai/bring-your-own-model.html#configuration">Navie Bring Your Own Model</a>
, the location will be the value of the <code>OPENAI_BASE_URL</code> environment variable, for example <code>via localhost</code> when using <a href="/docs/using-navie-ai/bring-your-own-model.html#ollama">Ollama</a> or <a href="/docs/using-navie-ai/bring-your-own-model.html#lm-studio">LM Studio</a>. 
  <b><li>Navie Chat Window</li></b>
  This is your primary location for interacting with Navie.  Here you can ask Navie questions about how your application works, ask Navie to generate code or test cases, and you can even have Navie create a pull request based on your changes. To learn more about specific Navie commands refer to the <a href="#navie-commands">Navie Commands</a>  section.  
</ol>
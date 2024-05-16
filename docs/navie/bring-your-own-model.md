---
layout: docs
title: Docs - Navie
name: Bring Your Own LLM Model
step: 4
navie: true
toc: true
description: Use AppMap Navie with your own OpenAI account or OpenAI-compatible LLM running either locally or remotely.
redirect_from: [/docs/navie/bring-your-own-llm, /docs/navie/bring-your-own-key]
---

# Bring Your Own LLM Model

By default, when asking a question to Navie, your code editor will interact with the AppMap hosted proxy for OpenAI.  If you have a requirement to bring your own key or otherwise use your own OpenAI account you can specify your own OpenAI key; this will cause Navie to connect to OpenAI directly, without AppMap proxy acting as an intermediate.
- [Navie AI Recommended Models](#navie-ai-recommended-models)
- [Bring Your Own OpenAI API Key (BYOK)](#bring-your-own-openai-api-key-byok)
  - [Configuring Your OpenAI Key](#configuring-your-openai-key)
    - [Modify which OpenAI Model to use](#modify-which-openai-model-to-use)
  - [Reset Navie AI to use Default Navie Backend](#reset-navie-ai-to-use-default-navie-backend)
- [Bring Your Own Model (BYOM)](#bring-your-own-model-byom)
  - [Configuration](#configuration)
  - [Configuring in JetBrains](#configuring-in-jetbrains)
  - [Configuring in VS Code](#configuring-in-vs-code)
- [Examples](#examples)

## Navie AI Recommended Models

<p class="alert alert-danger">
AppMap Navie AI recommends avoiding models that do not support chat mode.
</p>

<table class="table table-striped table-bordered black-white-table">
  <tr>
    <tr>
      <th class="large-header">Navie AI Backend LLM</th>
      <th class="large-header">Ease of Setup</th>
      <th class="large-header">Quality of Responses</th>
  </tr>
  <tr>
    <tr>
      <td>AppMap OpenAI Proxy (default)</td>
      <td>⭐⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
  </tr>
  <tr>
    <tr>
      <td>Self Managed OpenAI API Key</td>
      <td>⭐⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
  </tr>
      <tr>
      <td>Azure Hosted OpenAI</td>
      <td>⭐⭐⭐</td>
      <td>⭐⭐⭐⭐⭐</td>
  </tr>
  </tr>
      <tr>
      <td>Anyscale Hosted Mixtral-8x7B</td>
      <td>⭐⭐⭐</td>
      <td>⭐⭐⭐</td>
  </tr>
  </tr>
      <tr>
      <td>Locally Hosted Mixtral-8x7B-Instruct-v0.1</td>
      <td>⭐⭐</td>
      <td>⭐⭐⭐</td>
  </tr>
  </tr>
      <tr>
      <td>Codellama/Codeqwen</td>
      <td>❌ Not Supported</td>
      <td>❌ Not Supported</td>
  </tr>
</table>

## Bring Your Own OpenAI API Key (BYOK)

Navie AI uses the AppMap hosted proxy with an AppMap managed OpenAI API key. If you have requirements to use your existing OpenAI API key, you can configure that within AppMap. This will ensure all Navie requests will be interacting with your own OpenAI account. 

### Configuring Your OpenAI Key

In your code editor, open the Navie Chat window. If the model displays `(default)`, this means that Navie is configured to use the AppMap hosted OpenAI proxy.  Click on the gear icon in the top of the Navie Chat window to change the model. 

![Navie configuration gear](/assets/img/product/navie-default-model.webp)

In the modal, select the option to `Use your own OpenAI API key`

![Use your own key modal](/assets/img/product/navie-byok-openai-1.webp)

After you enter your OpenAI API Key in the menu option, hit `enter` and your code editor will be prompted to reload.

**In VS Code:**
![VS Code popup to store API Key](/assets/img/product/navie-byok-openai-2.webp)

**In JetBrains:**
![JetBrains popup to store API Key](/assets/img/product/navie-byok-jetbrains.webp)

**NOTE:** You can also use the environment variable in the [configuration](#configuration) section to store your API key as an environment variable instead of using the `gear` icon in the Navie chat window. 

After your code editor reloads, you can confirm your requests are being routed to OpenAI directly in the Navie Chat window. It will list the model `OpenAI` and the location, in this case `via OpenAI`.

![OpenAI location](/assets/img/product/navie-byok-openai-3.webp)

#### Modify which OpenAI Model to use

AppMap generally uses the latest OpenAI models as the default, but if you want to use an alternative model like `gpt-3.5` or a preview model like `gpt-4-vision-preview` you can modify the `APPMAP_NAVIE_MODEL` environment variable after configuring your own OpenAI API key to use other OpenAI models.  

After setting your `APPMAP_NAVIE_MODEL` with your chosen model reload/restart your code editor and then confirm it's configuration by opening a new Navie chat window. In this example i've configured my model to be `gpt-4o` with my personal OpenAI API Key. 

![JetBrains OpenAI key modal](/assets/img/product/custom-model.webp)

### Reset Navie AI to use Default Navie Backend

At any time, you can unset your OpenAI API Key and revert usage back to using the AppMap hosted OpenAI proxy.  Select the gear icon in the Navie Chat window and select `Use Navie Backend` in the modal. 

![Navie Recommended Models](/assets/img/product/navie-use-default-backend.webp)

## Bring Your Own Model (BYOM)

<p class="alert alert-info">
<b>This feature is in early access.</b> We currently recommend GPT4-Turbo from OpenAI via OpenAI or Microsoft Azure, and Mixtral-8x7B-Instruct-v0.1.  Refer to the <a href="/docs/navie/bring-your-own-model.html#navie-ai-recommended-models">AppMap Recommended Models documentation</a> for more info
</p>

Another option is to use a different LLM entirely; you can use any OpenAI-compatible model 
running either locally or remotely. When configured like this, as in the BYOK case,
Navie won't contact the AppMap hosted proxy and your conversations will stay private
between you and the model.

### Configuration

In order to configure Navie for your own LLM, certain environment variables need to be set for AppMap services.

You can use the following variables to direct Navie to use any LLM with an OpenAI-compatible API.
If only the API key is set, Navie will connect to OpenAI.com by default.

* `OPENAI_API_KEY` — API key to use with OpenAI API.
* `OPENAI_BASE_URL` — base URL for OpenAI API (defaults to the OpenAI.com endpoint).
* `APPMAP_NAVIE_MODEL` — name of the model to use (the default is GPT-4).
* `APPMAP_NAVIE_TOKEN_LIMIT` — maximum context size in tokens (default 8000).

For Azure OpenAI, you need to [create a deployment](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) and use these variables instead:

* `AZURE_OPENAI_API_KEY` — API key to use with Azure OpenAI API.
* `AZURE_OPENAI_API_VERSION` — API version to use when communicating with Azure OpenAI, [eg. `2024-02-01`](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation)
* `AZURE_OPENAI_API_INSTANCE_NAME` — Azure OpenAI instance name (ie. the part of the URL before `openai.azure.com`)
* `AZURE_OPENAI_API_DEPLOYMENT_NAME` — Azure OpenAI deployment name.

[Configuring in JetBrains](#configuring-byom-in-jetbrains)  
[Configuring in VS Code](#configuring-byom-in-vs-code)

### Configuring in JetBrains

In JetBrains, go to settings.

<img class="video-screenshot" alt="a screenshot of the JetBrains menu" src="/assets/img/docs/goto-intellij-settings.webp" />

Go to *Tools* → *AppMap*.

<img class="video-screenshot" alt="a screenshot of the AppMap settings in JetBrains" src="/assets/img/docs/intellij-tools-appmap-settings.webp"/>

Enter the environment editor.
<img class="video-screenshot" alt="a screenshot of the entering the AppMap environment editor in JetBrains" src="/assets/img/docs/intellij-enter-env-editor.webp"/>

Use the editor to define the relevant environment variables according to the [BYOM documentation](/docs/navie/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot of the environment editor in JetBrains" src="/assets/img/docs/intellij-env-editor.webp" />

**Reload your IDE for the changes to take effect.**

After reloading you can confirm the model is configured correctly in the Navie Chat window.

<img class="video-screenshot" src="/assets/img/product/navie-confirm-ui-jetbrains.webp"/>

### Configuring in VS Code

#### Editing AppMap services environment <!-- omit in toc -->

In VS Code, go to settings.

<img class="video-screenshot" src="/assets/img/docs/goto-vscode-settings.webp" alt="a screenshot of the Visual Studio Code menu"/>

 Search for “appmap environment” to reveal “AppMap: Command Line Environment” setting.

<img class="video-screenshot" alt="a screenshot of the AppMap: Command Line Environment settings section" src="/assets/img/docs/search-for-appmap-environment.webp"/>

Use *Add Item* to define the relevant environment variables according to the [BYOM documentation](/docs/navie/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot showing an example of the bring your own model key value entry" src="/assets/img/docs/byom-key-value-example.webp"/>

Reload your VS Code for the changes to take effect.  

After reloading you can confirm the model is configured correctly in the Navie Chat window.

<img class="video-screenshot" src="/assets/img/product/navie-confirm-ui-vscode.webp"/>

## Examples

Refer to the [Navie Reference Guide](/docs/reference/navie) for detailed examples of using Navie with your own LLM backend.

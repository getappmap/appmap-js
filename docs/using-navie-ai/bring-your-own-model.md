---
layout: docs
title: Docs - Navie
name: Choose Your LLM
step: 2
navie: true
toc: true
description: Use AppMap Navie with your own OpenAI account or OpenAI-compatible LLM running either locally or remotely.
redirect_from: [/docs/navie/bring-your-own-llm, /docs/navie/bring-your-own-key, /docs/navie/bring-your-own-model.html]
---

# Choose Your LLM

When you ask Navie a question, your code editor will connect to a configured LLM provider. If you have GitHub Copilot installed and activated,
Navie will connect to the Copilot LLM by default. Otherwise, Navie will connect to an AppMap-hosted OpenAI proxy by default.

You can also bring your own LLM API key, or use a local model. 

- [Using GitHub Copilot Language Models](#using-github-copilot-language-models)
- [Bring Your Own OpenAI API Key (BYOK)](#bring-your-own-openai-api-key-byok)
- [Bring Your Own Anthropic (Claude) API Key (BYOK)](#bring-your-own-anthropic-claude-api-key-byok)
- [Bring Your Own Model (BYOM)](#bring-your-own-model-byom)
- [Examples](#examples)

## Using GitHub Copilot Language Models

With modern versions of VSCode and JetBrains IDEs, and with an active GitHub Copilot subscription, you can use the Copilot LLM as the LLM backend for Navie. This allows you to leverage the powerful runtime powered Navie AI Architect with your existing Copilot subscription. This is the recommended, and default, option for users in corporate environments where Copilot is approved and available.

### Requirements (VSCode) <!-- omit in toc -->

The following items are required to use the GitHub Copilot Language Model with Navie in VSCode:

- VS Code Version `1.91` or greater
- AppMap Extension version `v0.123.0` or greater
- GitHub Copilot extension installed and activated

<div class="alert alert-info">NOTE: If you have configured your <code>OPENAI_API_KEY</code> or other environment variables these will override any settings chosen from within the code editor extension. Unset these environment variables before changing your LLM or API key in your code editor</div>

### Requirements (JetBrains) <!-- omit in toc -->

The following items are required to use the GitHub Copilot Language Model with Navie in JetBrains IDEs:

- JetBrains IDE version `2023.1` or greater
- AppMap Plugin version `v0.76.0` or greater
- GitHub Copilot plugin installed and activated

<div class="alert alert-info">NOTE: If you have configured your <code>OPENAI_API_KEY</code> or other environment variables these will override any settings chosen from within the code editor extension. Unset these environment variables before changing your LLM or API key in your code editor</div>

### Choosing the GitHib Copilot LLM Provider <!-- omit in toc -->

Open Navie, then use the gear icon or the "change the lanugage model provider" link
to open the LLM configuration dialog.

Select "GitHub Copilot", or any of the other options.

<img src="/assets/img/docs/navie-llm-configuration-dialog.png" alt="Navie LLM configuration dialog" class="video-screenshot" />

#### VSCode Settings <!-- omit in toc -->

You can also choose the Copilot provider in VSCode using the Settings.
Open the VS Code Settings, and search for `navie vscode`

<img class="video-screenshot" src="/assets/img/product/navie-copilot-1.webp"/> 

Click the box to use the `VS Code language model...`

After clicking the box to enable the VS Code LM, you'll be instructed to reload your VS Code to enable these changes.

For more details about using the GitHub Copilot Language Model as a supported Navie backend, refer to the [Navie reference guide](/docs/navie-reference/navie-bring-your-own-model-examples.html)

### Video Demo

{% include vimeo.html id='992238965' %}

## Bring Your Own OpenAI API Key (BYOK)

You can use your own LLM provider API key, and configure that within AppMap. This will ensure all Navie requests will be interacting with your LLM provider of choice.

### Configuring Your OpenAI Key <!-- omit in toc -->

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

#### Modify which OpenAI Model to use <!-- omit in toc -->

AppMap generally uses the latest OpenAI models as the default, but if you want to use an alternative model like `gpt-3.5` or a preview model like `gpt-4-vision-preview` you can modify the `APPMAP_NAVIE_MODEL` environment variable after configuring your own OpenAI API key to use other OpenAI models.  

After setting your `APPMAP_NAVIE_MODEL` with your chosen model reload/restart your code editor and then confirm it's configuration by opening a new Navie chat window. In this example I've configured my model to be `gpt-4o` with my personal OpenAI API Key. 

![JetBrains OpenAI key modal](/assets/img/product/custom-model.webp)

### Reset Navie AI to use Default Navie Backend <!-- omit in toc -->

At any time, you can unset your OpenAI API Key and revert usage back to using the AppMap hosted OpenAI proxy.  Select the gear icon in the Navie Chat window and select `Use Navie Backend` in the modal. 

![Navie Recommended Models](/assets/img/product/navie-use-default-backend.webp)

## Bring Your Own Anthropic (Claude) API Key (BYOK)

AppMap supports the Anthropic suite of large language models such as Claude Sonnet or Claude Opus.  

To use AppMap Navie with Anthropic LLMs you need to generate an API key for your account.  

Login to your [Anthropic dashboard](https://console.anthropic.com/dashboard), and choose the option to "Get API Keys"

Click the box to "Create Key"

![Anthropic Create Key](/assets/img/product/create-anthropic-key.webp)

In the next box, give your key an easy to recognize name. 

![Anthropic Key Name](/assets/img/product/give-anthropic-key-name.webp)

In your VS Code or JetBrains editor, configure the following environment variables.  For more details on configuring 
these environment variables in your VS Code or JetBrains editor, refer to the [AppMap BOYK documentation.](/docs/using-navie-ai/bring-your-own-model.html#configuration)

```
ANTHROPIC_API_KEY=sk-ant-api03-12...
APPMAP_NAVIE_MODEL=claude-3-5-sonnet-20240620
```

When setting the `APPMAP_NAVIE_MODEL` refer to the [Anthropic documentation](https://docs.anthropic.com/en/docs/intro-to-claude#model-options) for the latest available models to chose from. 

{% include vimeo.html id='1003330117' %}

## Bring Your Own Model (BYOM)

<p class="alert alert-info">
  <b>This feature is in early access.</b>
  We recommend choosing a model that is trained on a large corpus of both human-written natural language and code.
</p>

Navie currently supports any OpenAI-compatible model running locally or remotely. When configured like this, as in the BYOK case, Navie won't contact the AppMap hosted proxy and your conversations will stay private between you and the model provider.

### Configuration

<div class="alert alert-info">We only recommend setting the environment variables below for advanced users. These settings will override any settings configured with the "gear" icon in your code editor. Unset these environment variables before using the "gear" icon to configure your model.</div>

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

### Configuring in JetBrains <!-- omit in toc -->

In JetBrains, go to settings.

<img class="video-screenshot" alt="a screenshot of the JetBrains menu" src="/assets/img/docs/goto-intellij-settings.webp" />

Go to *Tools* → *AppMap*.

<img class="video-screenshot" alt="a screenshot of the AppMap settings in JetBrains" src="/assets/img/docs/intellij-tools-appmap-settings.webp"/>

Enter the environment editor.
<img class="video-screenshot" alt="a screenshot of the entering the AppMap environment editor in JetBrains" src="/assets/img/docs/intellij-enter-env-editor.webp"/>

Use the editor to define the relevant environment variables according to the [BYOM documentation](/docs/using-navie-ai/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot of the environment editor in JetBrains" src="/assets/img/docs/intellij-env-editor.webp" />

**Reload your IDE for the changes to take effect.**

After reloading you can confirm the model is configured correctly in the Navie Chat window.

<img class="video-screenshot" src="/assets/img/product/navie-confirm-ui-jetbrains.webp"/>

### Configuring in VS Code <!-- omit in toc -->

#### Editing AppMap services environment <!-- omit in toc -->

In VS Code, go to settings.

<img class="video-screenshot" src="/assets/img/docs/goto-vscode-settings.webp" alt="a screenshot of the Visual Studio Code menu"/>

 Search for “appmap environment” to reveal “AppMap: Command Line Environment” setting.

<img class="video-screenshot" alt="a screenshot of the AppMap: Command Line Environment settings section" src="/assets/img/docs/search-for-appmap-environment.webp"/>

Use *Add Item* to define the relevant environment variables according to the [BYOM documentation](/docs/using-navie-ai/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot showing an example of the bring your own model key value entry" src="/assets/img/docs/byom-key-value-example.webp"/>

Reload your VS Code for the changes to take effect.  

After reloading you can confirm the model is configured correctly in the Navie Chat window.

<img class="video-screenshot" src="/assets/img/product/navie-confirm-ui-vscode.webp"/>

## Examples

Refer to the [Navie Reference Guide](/docs/navie-reference/navie-bring-your-own-model-examples.html) for detailed examples of using Navie with your own LLM backend.

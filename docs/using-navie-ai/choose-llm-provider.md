---
layout: docs
title: Docs - Navie
name: Choosing an LLM Provider
step: 2
navie: true
description: Use AppMap Navie with GitHub Copilot, your own remote LLM provider, or local LLM.
redirect_from: [/docs/navie/bring-your-own-llm, /docs/navie/bring-your-own-key, /docs/navie/bring-your-own-model.html]
---

## Choose Your LLM Provider

When you ask Navie AI a question, it will connect to the LLM provider of your choice.

# LLM Provider

- [GitHub Copilot Language Model](#github-copilot-language-model)
- [OpenAI](#openai)
- [Anthropic (Claude)](#anthropic-claude)
- [Google Gemini](#google-gemini)
- [Azure OpenAI](#azure-openai)
- [AnyScale Endpoints](#anyscale-endpoints)
- [Fireworks AI](#fireworks-ai)
- [Ollama](#ollama)
- [LM Studio](#lm-studio)

## GitHub Copilot Language Model

With VS Code version 1.91 or later and an active GitHub Copilot subscription, GitHub Copilot is the default LLM provider for Navie.
This allows you to leverage the powerful runtime powered Navie AI Architect with your existing Copilot subscription. This is the
recommended option for users in corporate environments where Copilot is the only approved and supported language model.

### Requirements (VSCode) <!-- omit in toc -->

The following items are required to use the GitHub Copilot Language Model with Navie in VSCode:

- VS Code Version `1.91` or greater
- AppMap Extension version `v0.123.0` or greater
- GitHub Copilot extension installed and activated

### Requirements (JetBrains) <!-- omit in toc -->

The following items are required to use the GitHub Copilot Language Model with Navie in JetBrains IDEs:

- JetBrains IDE version `2023.1` or greater
- AppMap Plugin version `v0.76.0` or greater
- GitHub Copilot plugin installed and activated

### Choosing the GitHib Copilot LLM Provider <!-- omit in toc -->

<div class="alert alert-info">
  NOTE: Copilot is the default LLM provider. This guide is provided primarily for situtations in which you've switched off Copilot and want to switch back.
</div>

<div class="alert alert-info">
  NOTE: If you have set <code>OPENAI_API_KEY</code> or another LLM API key environment variable, it will override the settings chosen from the code editor extension. Unset
  LLM API key environment variables before changing your Navie LLM configuration in the code editor.
</div>

Open a new Navie chat, then use the gear icon or the "change the lanugage model provider" link
to open the LLM configuration dialog.

Select "GitHub Copilot":

<img src="/assets/img/docs/navie-llm-configuration-dialog.png" alt="Navie LLM configuration dialog" class="video-screenshot" />

## OpenAI

**Note:** We recommend configuring your OpenAI key using the code editor extension. The configuration options below are for advanced users.

Only `OPENAI_API_KEY` needs to be set, other settings can stay default:

| `OPENAI_API_KEY`| `sk-9spQsnE3X7myFHnjgNKKgIcGAdaIG78I3HZB4DFDWQGM` |

When using your own OpenAI API key, you can also modify the OpenAI model for Navie to use. For example if you wanted to use `gpt-3.5` or use an preview model like `gpt-4-vision-preview`.

| `APPMAP_NAVIE_MODEL`| `gpt-4-vision-preview` |

You can use your own LLM provider API key, and configure that within AppMap. This will ensure all Navie requests will be interacting with your LLM provider of choice.

### Configuring Your OpenAI Key <!-- omit in toc -->

In your code editor, open the Navie Chat window. If the model displays `(default)`, this means that Navie is configured to use the AppMap hosted OpenAI proxy. Click on the gear icon in the top of the Navie Chat window to change the model.

![Navie configuration gear](/assets/img/product/navie-default-model.webp)

In the modal, select the option to `Use your own OpenAI API key`

![Use your own key modal](/assets/img/product/navie-byok-openai-1.webp)

After you enter your OpenAI API Key in the menu option, hit `enter` and your code editor will be prompted to reload.

**In VS Code:**
![VS Code popup to store API Key](/assets/img/product/navie-byok-openai-2.webp)

**In JetBrains:**
![JetBrains popup to store API Key](/assets/img/product/navie-byok-jetbrains.webp)

**NOTE:** You can also use an environment variable to store your API key as an environment variable instead of using the `gear` icon in the Navie chat window.

After your code editor reloads, you can confirm your requests are being routed to OpenAI directly in the Navie Chat window. It will list the model `OpenAI` and the location, in this case `via OpenAI`.

![OpenAI location](/assets/img/product/navie-byok-openai-3.webp)

#### Modify which OpenAI Model to use <!-- omit in toc -->

AppMap generally uses the latest OpenAI models as the default, but if you want to use an alternative model like `gpt-3.5` or a preview model like `gpt-4-vision-preview` you can modify the `APPMAP_NAVIE_MODEL` environment variable after configuring your own OpenAI API key to use other OpenAI models.

After setting your `APPMAP_NAVIE_MODEL` with your chosen model reload/restart your code editor and then confirm it's configuration by opening a new Navie chat window. In this example I've configured my model to be `gpt-4o` with my personal OpenAI API Key.

![JetBrains OpenAI key modal](/assets/img/product/custom-model.webp)

## Anthropic (Claude)

### Version A

AppMap supports the Anthropic suite of large language models such as Claude Sonnet or Claude Opus.

To use AppMap Navie with Anthropic LLMs you need to generate an API key for your account.

Login to your [Anthropic dashboard](https://console.anthropic.com/dashboard), and choose the option to "Get API Keys"

Click the box to "Create Key"

![Anthropic Create Key](/assets/img/product/create-anthropic-key.webp)

In the next box, give your key an easy to recognize name.

![Anthropic Key Name](/assets/img/product/give-anthropic-key-name.webp)

In your VS Code or JetBrains editor, configure the following environment variables.

```
ANTHROPIC_API_KEY=sk-ant-api03-12...
APPMAP_NAVIE_MODEL=claude-3-5-sonnet-20240620
```

When setting the `APPMAP_NAVIE_MODEL` refer to the [Anthropic documentation](https://docs.anthropic.com/en/docs/intro-to-claude#model-options) for the latest available models to chose from.

{% include vimeo.html id='1003330117' %}

### Version B

AppMap supports the Anthropic suite of large language models such as Claude Sonnet or Claude Opus.

To use AppMap Navie with Anthropic LLMs you need to generate an API key for your account.

Login to your [Anthropic dashboard](https://console.anthropic.com/dashboard), and choose the option to "Get API Keys"

Click the box to "Create Key"

![Anthropic Create Key](/assets/img/product/create-anthropic-key.webp)

In the next box, give your key an easy to recognize name.

![Anthropic Key Name](/assets/img/product/give-anthropic-key-name.webp)

In your VS Code or JetBrains editor, configure the following environment variables:

| `ANTHROPIC_API_KEY`| `sk-ant-api03-8SgtgQrGB0vTSsB_DeeIZHvDrfmrg` |
| `APPMAP_NAVIE_MODEL`| `claude-3-5-sonnet-20240620` |

When setting the `APPMAP_NAVIE_MODEL` refer to the [Anthropic documentation](https://docs.anthropic.com/en/docs/intro-to-claude#model-options) for the latest available models to chose from.

#### Video Demo <!-- omit in toc -->

{% include vimeo.html id='1003330117' %}

## Google Gemini

After configuring your [Google Cloud authentication keys](https://cloud.google.com/docs/authentication/api-keys) and ensuring you have access to the Google Gemini services on your Google Cloud account, configure the following environment variables in your VS Code editor.

| `GOOGLE_WEB_CREDENTIALS` | `[contents of downloaded JSON]`
| `APPMAP_NAVIE_MODEL` | `gemini-1.5-pro-002`
| `APPMAP_NAVIE_COMPLETION_BACKEND` | `vertex-ai`

![Configure navie environment variables](/assets/img/product/navie-gemini-config-1.webp)

You can confirm your model and API endpoint after making this change in the Navie chat window, which will display the currently configured language model backend.
![confirm LLM backend and api endpoint](/assets/img/product/navie-gemini-config-2.webp)

## Azure OpenAI

Assuming you [created](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) a `navie` GPT-4 deployment on `contoso.openai.azure.com` OpenAI instance:

| `AZURE_OPENAI_API_KEY` | `e50edc22e83f01802893d654c4268c4f` |
| `AZURE_OPENAI_API_VERSION` | `2024-02-01` |
| `AZURE_OPENAI_API_INSTANCE_NAME` | `contoso` |
| `AZURE_OPENAI_API_DEPLOYMENT_NAME` | `navie` |

## AnyScale Endpoints

[AnyScale Endpoints](https://www.anyscale.com/endpoints) allows querying a
selection of open-source LLMs. After you create an account you can use it by
setting:

| `OPENAI_API_KEY` | `esecret_myxfwgl1iinbz9q5hkexemk8f4xhcou8` |
| `OPENAI_BASE_URL` | `https://api.endpoints.anyscale.com/v1` |
| `APPMAP_NAVIE_MODEL` | `mistralai/Mixtral-8x7B-Instruct-v0.1` |

Consult [AnyScale documentation](https://docs.endpoints.anyscale.com/) for model
names. Note we recommend using Mixtral models with Navie.

#### Anyscale Demo with VS Code <!-- omit in toc -->

{% include vimeo.html id='970914908' %}

#### Anyscale Demo with JetBrains <!-- omit in toc -->

{% include vimeo.html id='970914884' %}

## Fireworks AI

You can use [Fireworks AI](https://fireworks.ai/) and their serverless or on-demand
models as a compatible backend for AppMap Navie AI.

After creating an account on Fireworks AI you can configure your Navie environment
settings:

| `OPENAI_API_KEY` | `WBYq2mKlK8I16ha21k233k2EwzGAJy3e0CLmtNZadJ6byfpu7c` |
| `OPENAI_BASE_URL` | `https://api.fireworks.ai/inference/v1` |
| `APPMAP_NAVIE_MODEL` | `accounts/fireworks/models/mixtral-8x22b-instruct` |

Consult the [Fireworks AI documentation](https://fireworks.ai/models) for a full list of
the available models they currently support.

#### Video Demo <!-- omit in toc -->

{% include vimeo.html id='992941358' %}

## Ollama

You can use [Ollama](https://ollama.com/) to run Navie with local models; after
you've successfully ran a model with `ollama run` command, you can configure
Navie to use it:

| `OPENAI_API_KEY` | `dummy` |
| `OPENAI_BASE_URL` | `http://127.0.0.1:11434/v1` |
| `APPMAP_NAVIE_MODEL` | `mixtral` |

**Note:** Even though it's running locally a dummy placeholder API key is still required.

## LM Studio

You can use [LM Studio](https://lmstudio.ai/) to run Navie with local models.

After downloading a model to run, select the option to run a local server.

<img class="video-screenshot" src="/assets/img/product/lmstudio-run-local-server.webp"/>

In the next window, select which model you want to load into the local inference server.

<img class="video-screenshot" src="/assets/img/product/lmstudio-load-model.webp"/>

After loading your model, you can confirm it's successfully running in the logs.

_NOTE_: Save the URL it's running under to use for `OPENAI_BASE_URL` environment variable.

For example: `http://localhost:1234/v1`

<img class="video-screenshot" src="/assets/img/product/lmstudio-confirm-running.webp"/>

In the `Model Inspector` copy the name of the model and use this for the `APPMAP_NAVIE_MODEL` environment variable.

For example: `Meta-Llama-3-8B-Instruct-imatrix`

<img class="video-screenshot" src="/assets/img/product/lmstudio-model-inspector.webp"/>

Continue to configure your local environment with the following environment variables based on your LM Studio configuration. Refer to the documentation above for steps specific to your code editor.

| `OPENAI_API_KEY` | `dummy` |
| `OPENAI_BASE_URL` | `http://localhost:1234/v1` |
| `APPMAP_NAVIE_MODEL` | `Meta-Llama-3-8B-Instruct-imatrix` |

**Note:** Even though it's running locally a dummy placeholder API key is still required.

{% include vimeo.html id='969002308' %}

---
layout: docs
title: Docs - AppMap Navie
description: "Reference Guide to AppMap Navie AI, examples of bring-your-own-llm configurations."
name: Bring Your Own Model Examples
navie-reference: true
toc: true
step: 5
redirect_from: [/docs/navie-reference/navie-copilot-backend]
---

# Bring Your Own Model Examples

- [GitHub Copilot Language Model](#github-copilot-language-model)
    - [Changing the Copilot Language Model](#changing-the-copilot-language-model)
- [Google Gemini](#google-gemini)
- [OpenAI](#openai)
- [Anthropic (Claude)](#anthropic-claude)
- [Azure OpenAI](#azure-openai)
- [AnyScale Endpoints](#anyscale-endpoints)
- [Fireworks AI](#fireworks-ai)
- [Ollama](#ollama)
- [LM Studio](#lm-studio)

## GitHub Copilot Language Model

Starting with VS Code `1.91` and greater, and with an active GitHub Copilot subscription, you can use Navie with the Copilot Language Model as a supported backend model.  This allows you to leverage the powerful runtime powered Navie AI Architect  with your existing Copilot subscription.  This is the recommended option for users in corporate environments where Copilot is the only approved and supported language model. 

#### Requirements <!-- omit in toc -->

The following items are required to use the GitHub Copilot Language Model with Navie:

- VS Code Version `1.91` or greater
- AppMap Extension version `v0.123.0` or greater
- GitHub Copilot VS Code extension must be installed
- Signed into an active paid or trial GitHub Copilot subscription

#### Setup <!-- omit in toc -->

Open the VS Code Settings, and search for `navie vscode`

<img class="video-screenshot" src="/assets/img/product/navie-copilot-1.webp"/> 

Click the box to use the `VS Code language model...`

After clicking the box to enable the VS Code LM, you'll be instructed to reload your VS Code to enable these changes.

<img class="video-screenshot" src="/assets/img/product/navie-copilot-2.webp"/> 

After VS Code finishes reloading, open the AppMap extension.  

Select `New Navie Chat`, and confirm the model listed is `(via copilot)`

<img class="video-screenshot" src="/assets/img/product/navie-copilot-3.webp"/> 

You'll need to allow the AppMap extension access to the Copilot Language Models.  After asking your first question to Navie, click `Allow` to the popup to allow the necessary access. 

<img class="video-screenshot" src="/assets/img/product/navie-copilot-4.webp"/> 

#### Troubleshooting <!-- omit in toc -->

If you attempt to enable the Copilot language models without the Copilot Extension installed, you'll see the following error in your code editor. 

<img class="video-screenshot" src="/assets/img/product/navie-copilot-5.webp"/> 

Click `Install Copilot` to complete the installation for language model support.

If you have the Copilot extension installed, but have not signed in, you'll see the following notice.

<img class="video-screenshot" src="/assets/img/product/navie-copilot-6.webp"/> 

Click the `Sign in to GitHub` and login with an account that has a valid paid or trial GitHub Copilot subscription.

#### Changing the Copilot Language Model

GitHub Copilot supports a variety of different language models. Use the VS Code command "AppMap: Select Copilot Model" in the command palette.

To open the Command Palette.

You can use a hotkey to open the VS Code Command Palette
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

Search for `AppMap: Select Copilot Model` in the command palette.
  
![Select copilot model](/assets/img/product/select-copilot-model-1.webp)

Then select the specific model you'd like to use with AppMap Navie

![Select copilot model](/assets/img/product/select-copilot-model-2.webp)

#### Video Demo  <!-- omit in toc -->

{% include vimeo.html id='992238965' %}

## Google Gemini

After configuring your [Google Cloud authentication keys](https://cloud.google.com/docs/authentication/api-keys) and ensuring you have access to the Google Gemini services on your Google Cloud account, configure the following environment variables in your VS Code editor.  [Refer to the Navie documentation](/docs/using-navie-ai/bring-your-own-model.html#configuring-in-vs-code) for more details on where to set the Navie environment variables.

| `GOOGLE_WEB_CREDENTIALS` | `[contents of downloaded JSON]`
| `APPMAP_NAVIE_MODEL` | `gemini-1.5-pro-002`
| `APPMAP_NAVIE_COMPLETION_BACKEND` | `vertex-ai`

![Configure navie environment variables](/assets/img/product/navie-gemini-config-1.webp)

***NOTE:*** If your code editor previously used the default GitHub Copilot backend, open the "gear" icon in the Navie chat window to reset the language model setting to use the environment variables instead by selecting "Use AppMap Hosted Provider". This will disable the GitHub Copilot Language Model backend and will by default use your environment variable configuration. 

![use appmap model to disable copilot as a backend](/assets/img/product/navie-llm-configuration.webp)

You can confirm your model and API endpoint after making this change in the Navie chat window, which will display the currently configured language model backend. 
![confirm LLM backend and api endpoint](/assets/img/product/navie-gemini-config-2.webp)

## OpenAI

**Note:** We recommend configuring your OpenAI key using the code editor extension. Follow the [Bring Your Own Key](/docs/using-navie-ai/bring-your-own-model.html#configuring-your-openai-key) docs for instructions.  The configuration options below are for advanced users. 

Only `OPENAI_API_KEY` needs to be set, other settings can stay default:

| `OPENAI_API_KEY`| `sk-9spQsnE3X7myFHnjgNKKgIcGAdaIG78I3HZB4DFDWQGM` |

When using your own OpenAI API key, you can also modify the OpenAI model for Navie to use.  For example if you wanted to use `gpt-3.5` or use an preview model like `gpt-4-vision-preview`.

| `APPMAP_NAVIE_MODEL`| `gpt-4-vision-preview` |

## Anthropic (Claude)

AppMap supports the Anthropic suite of large language models such as Claude Sonnet or Claude Opus.  

To use AppMap Navie with Anthropic LLMs you need to generate an API key for your account.  

Login to your [Anthropic dashboard](https://console.anthropic.com/dashboard), and choose the option to "Get API Keys"

Click the box to "Create Key"

![Anthropic Create Key](/assets/img/product/create-anthropic-key.webp)

In the next box, give your key an easy to recognize name. 

![Anthropic Key Name](/assets/img/product/give-anthropic-key-name.webp)

In your VS Code or JetBrains editor, configure the following environment variables.  For more details on configuring 
these environment variables in your VS Code or JetBrains editor, refer to the [AppMap BOYK documentation.](/docs/using-navie-ai/bring-your-own-model.html#configuration)

| `ANTHROPIC_API_KEY`| `sk-ant-api03-8SgtgQrGB0vTSsB_DeeIZHvDrfmrg` |
| `APPMAP_NAVIE_MODEL`| `claude-3-5-sonnet-20240620` |


When setting the `APPMAP_NAVIE_MODEL` refer to the [Anthropic documentation](https://docs.anthropic.com/en/docs/intro-to-claude#model-options) for the latest available models to chose from. 

#### Video Demo  <!-- omit in toc -->

{% include vimeo.html id='1003330117' %}

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

#### Anyscale Demo with VS Code  <!-- omit in toc -->

{% include vimeo.html id='970914908' %}

#### Anyscale Demo with JetBrains  <!-- omit in toc -->

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

#### Video Demo  <!-- omit in toc -->

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

*NOTE*: Save the URL it's running under to use for `OPENAI_BASE_URL` environment variable.

For example: `http://localhost:1234/v1`

<img class="video-screenshot" src="/assets/img/product/lmstudio-confirm-running.webp"/>

In the `Model Inspector` copy the name of the model and use this for the `APPMAP_NAVIE_MODEL` environment variable.

For example: `Meta-Llama-3-8B-Instruct-imatrix`

<img class="video-screenshot" src="/assets/img/product/lmstudio-model-inspector.webp"/>

Continue to configure your local environment with the following environment variables based on your LM Studio configuration.  Refer to the [documentation above](#bring-your-own-model-byom) for steps specific to your code editor.

| `OPENAI_API_KEY` | `dummy` |
| `OPENAI_BASE_URL` | `http://localhost:1234/v1` |
| `APPMAP_NAVIE_MODEL` | `Meta-Llama-3-8B-Instruct-imatrix` |

**Note:** Even though it's running locally a dummy placeholder API key is still required.

{% include vimeo.html id='969002308' %}
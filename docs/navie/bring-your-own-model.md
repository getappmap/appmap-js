---
layout: docs
title: Docs - AppMap Navie
name: Bring Your Own Model
step: 4
navie: true
toc: true
description: Use AppMap Navie AI with your own OpenAI account or OpenAI-compatible LLM running either locally or remotely.
redirect_from: [/docs/navie/bring-your-own-llm]
---
<p class="alert alert-info">
<b>This feature is in early access.</b> We will post various comparisons of AppMap with models, we currently recommend GPT4 from OpenAI via Open AI or Microsoft Azure, and Mixtral-8x7B-Instruct-v0.1.  We will update this section with additional models and more benchmarking details, please check back often for updates.
</p>

# Bring Your Own Model (BYOM)

By default, when asking a question to Navie, your code editor will interact with
the AppMap hosted proxy for OpenAI.  If you have a requirement to bring your own
key or otherwise use your own OpenAI account you can [use your own API 
key](/docs/navie/bring-your-own-key). You can also use any OpenAI-compatible LLM
running either locally or remotely. 


- [Setting environment variables](#setting-environment-variables)
- [Relevant environment variables](#relevant-environment-variables)
- [Examples](#examples)
  - [Azure OpenAI](#azure-openai)
  - [AnyScale Endpoints](#anyscale-endpoints)
  - [Ollama](#ollama)

## Setting environment variables

To configure Navie to use a different LLM you need to adjust the environment
its run in by the AppMap extension. In VS Code, you can do that in settings
(*Ctrl/Cmd+,* or *File*→*Preferences*→*Settings*). Search for “appmap
environment” to reveal “AppMap: Command Line Environment” setting
(`appMap.commandLineEnvironment`):

![a screenshot of the AppMap: Command Line Environment settings section](/assets/img/docs/navie-environment.png)

You can use *Add Item* to add the required items (see below for reference). Note
you need to reload your VS Code for the changes to take effect. Don't forget to
[set your API key](/docs/navie/bring-your-own-key)!

## Relevant environment variables

You can use the following variables to direct Navie to use any LLM with an OpenAI-compatible API.

* `OPENAI_BASE_URL` — base URL for OpenAI API.
* `APPMAP_NAVIE_MODEL` — name of the model to use instead of GPT-4.
* `APPMAP_NAVIE_TOKEN_LIMIT` — maximum context size in tokens (default 8000).

For Azure OpenAI, you need to [create a deployment](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) and use these variables instead:

* `AZURE_OPENAI_API_VERSION` — API version to use when communicating with Azure OpenAI, [eg. `2024-02-01`](https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation)
* `AZURE_OPENAI_API_INSTANCE_NAME` — Azure OpenAI instance name (ie. the part of the URL before `openai.azure.com`)
* `AZURE_OPENAI_API_DEPLOYMENT_NAME` — Azure OpenAI deployment name.

**Note:** Whether using Azure or another service, you need to configure the API key to
use by following instructions to [use your own API key](/docs/navie/bring-your-own-key).

## Examples

### Azure OpenAI

Assuming you [created](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) a `navie` GPT-4 deployment on `contoso.openai.azure.com` OpenAI instance:

| `AZURE_OPENAI_API_VERSION` | `2024-02-01` |
| `AZURE_OPENAI_API_INSTANCE_NAME` | `contoso` |
| `AZURE_OPENAI_API_DEPLOYMENT_NAME` | `navie` |

### AnyScale Endpoints

[AnyScale Endpoints](https://www.anyscale.com/endpoints) allows querying a
selection of open-source LLMs. After you create an account you can use it by
setting:

| `OPENAI_BASE_URL` | `https://api.endpoints.anyscale.com/v1` |
| `APPMAP_NAVIE_MODEL` | `mistralai/Mixtral-8x7B-Instruct-v0.1` |

Consult [AnyScale documentation](https://docs.endpoints.anyscale.com/) for model
names. Note we recommend using Mixtral models with Navie. Don't forget to [set
your API key](/docs/navie/bring-your-own-key)!

### Ollama

You can use [Ollama](https://ollama.com/) to run Navie with local models; after
you've successfully ran a model with `ollama run` command, you can configure
Navie to use it:

| `OPENAI_API_KEY` | `dummy` |
| `OPENAI_BASE_URL` | `http://127.0.0.1:11434/v1` |
| `APPMAP_NAVIE_MODEL` | `mixtral` |

**Note:** Even though it's running locally a dummy placeholder API key is still required.

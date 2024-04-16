---
layout: docs
title: Docs - Navie
name: Bring Your Own Key/Model
step: 4
navie: true
toc: true
description: Use AppMap Navie AI with your own OpenAI account or OpenAI-compatible LLM running either locally or remotely.
redirect_from: [/docs/navie/bring-your-own-llm, /docs/navie/bring-your-own-key]
---

# Bring Your Own LLM

By default, when asking a question to Navie, your code editor will interact with the AppMap hosted proxy for OpenAI.  If you have a requirement to bring your own key or otherwise use your own OpenAI account you can specify your own OpenAI key; this will cause Navie
to connect to OpenAI directly, without AppMap proxy acting as an intermediate.

- [Bring Your Own Model (BYOM)](#bring-your-own-model-byom)
- [Configuration](#configuration)
- [Examples](#examples)
  - [OpenAI.com](#openaicom)
  - [Azure OpenAI](#azure-openai)
  - [AnyScale Endpoints](#anyscale-endpoints)
  - [Ollama](#ollama)

## Bring Your Own Model (BYOM)

<p class="alert alert-info">
<b>This feature is in early access.</b> We will post various comparisons of AppMap with models, we currently recommend GPT4 from OpenAI via Open AI or Microsoft Azure, and Mixtral-8x7B-Instruct-v0.1.  We will update this section with additional models and more benchmarking details, please check back often for updates.
</p>

Another option is to use a different LLM entirely; you can use any OpenAI-compatible model 
running either locally or remotely. When configured like this, as in the BYOK case,
Navie won't contact the AppMap hosted proxy and your conversations will stay private
between you and the model.

## Configuration

In order to configure Navie for your own LLM, certain environment variables need to be set for AppMap services.
Please refer to the IDE-specific pages to see how to configure the variables in [VS Code](/docs/navie/byok/vs-code) and [IntelliJ](/docs/navie/byok/intellij).

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

## Examples

### OpenAI.com

Only `OPENAI_API_KEY` needs to be set, other settings can stay default:

| `OPENAI_API_KEY`| `sk-9spQsnE3X7myFHnjgNKKgIcGAdaIG78I3HZB4DFDWQGM` |

### Azure OpenAI

Assuming you [created](https://learn.microsoft.com/en-us/azure/ai-services/openai/how-to/create-resource) a `navie` GPT-4 deployment on `contoso.openai.azure.com` OpenAI instance:

| `AZURE_OPENAI_API_KEY` | `e50edc22e83f01802893d654c4268c4f` |
| `AZURE_OPENAI_API_VERSION` | `2024-02-01` |
| `AZURE_OPENAI_API_INSTANCE_NAME` | `contoso` |
| `AZURE_OPENAI_API_DEPLOYMENT_NAME` | `navie` |

### AnyScale Endpoints

[AnyScale Endpoints](https://www.anyscale.com/endpoints) allows querying a
selection of open-source LLMs. After you create an account you can use it by
setting:

| `OPENAI_API_KEY` | `esecret_myxfwgl1iinbz9q5hkexemk8f4xhcou8` |
| `OPENAI_BASE_URL` | `https://api.endpoints.anyscale.com/v1` |
| `APPMAP_NAVIE_MODEL` | `mistralai/Mixtral-8x7B-Instruct-v0.1` |

Consult [AnyScale documentation](https://docs.endpoints.anyscale.com/) for model
names. Note we recommend using Mixtral models with Navie.

### Ollama

You can use [Ollama](https://ollama.com/) to run Navie with local models; after
you've successfully ran a model with `ollama run` command, you can configure
Navie to use it:

| `OPENAI_API_KEY` | `dummy` |
| `OPENAI_BASE_URL` | `http://127.0.0.1:11434/v1` |
| `APPMAP_NAVIE_MODEL` | `mixtral` |

**Note:** Even though it's running locally a dummy placeholder API key is still required.

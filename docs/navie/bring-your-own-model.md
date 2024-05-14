---
layout: docs
title: Docs - Navie
name: Bring Your Own LLM Model
step: 3
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
  - [Reset Navie AI to use Default Navie Backend](#reset-navie-ai-to-use-default-navie-backend)
- [Bring Your Own Model (BYOM)](#bring-your-own-model-byom)
  - [Configuration](#configuration)
  - [Configuring in JetBrains](#configuring-in-jetbrains)
  - [Configuring in VS Code](#configuring-in-vs-code)
- [Examples](#examples)
  - [OpenAI](#openai)
  - [Azure OpenAI](#azure-openai)
  - [AnyScale Endpoints](#anyscale-endpoints)
  - [Ollama](#ollama)
  - [LM Studio](#lm-studio)

## Navie AI Recommended Models

<p class="alert alert-danger">
AppMap Navie AI recommends avoiding models that do not support chat mode.
</p>
<!-- This doc is located at https://docs.google.com/presentation/d/145gzoYVsgJ3J4jGh_2Or8ClZ0drqoC-GTjI1UqkyF_o/edit#slide=id.g1ff63dc2dd6_0_0 -->

![Navie Recommended Models](/assets/img/product/navie-model-recommendations.svg)

## Bring Your Own OpenAI API Key (BYOK)

Navie AI uses the AppMap hosted proxy with an AppMap managed OpenAI API key. If you have requirements to use your existing OpenAI API key, you can configure that within AppMap. This will ensure all Navie requests will be interacting with your own OpenAI account. 

### Configuring Your OpenAI Key

In your code editor, open the Navie Chat window. If the model displays `(default)`, this means that Navie is configured to use the AppMap hosted OpenAI proxy.  Click on the gear icon in the top of the Navie Chat window to change the model. 

![Navie Recommended Models](/assets/img/product/navie-default-model.webp)

In the modal, select the option to `Use your own OpenAI API key`

![Navie Recommended Models](/assets/img/product/navie-byok-openai-1.webp)

After you enter your OpenAI API Key in the menu option, hit `enter` and your code editor will be prompted to reload.

![Navie Recommended Models](/assets/img/product/navie-byok-openai-2.webp)

After your code editor reloads, you can confirm your requests are being routed to OpenAI directly in the Navie Chat window. It will list the model `OpenAI` and the location, in this case `via OpenAI`.

![Navie Recommended Models](/assets/img/product/navie-byok-openai-3.webp)

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

**Note**: To store the API key securely with VS Code secret storage, follow [the instructions below](#add-a-new-openai-key).

In VS Code, go to settings.

<img class="video-screenshot" src="/assets/img/docs/goto-vscode-settings.webp" alt="a screenshot of the Visual Studio Code menu"/>

 Search for “appmap environment” to reveal “AppMap: Command Line Environment” setting.

<img class="video-screenshot" alt="a screenshot of the AppMap: Command Line Environment settings section" src="/assets/img/docs/search-for-appmap-environment.webp"/>

Use *Add Item* to define the relevant environment variables according to the [BYOM documentation](/docs/navie/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot showing an example of the bring your own model key value entry" src="/assets/img/docs/byom-key-value-example.webp"/>

Reload your VS Code for the changes to take effect.  

**NOTE:** Please follow the instructions below to set `OPENAI_API_KEY` or `AZURE_OPENAI_API_KEY` securely.

After reloading you can confirm the model is configured correctly in the Navie Chat window.

<img class="video-screenshot" src="/assets/img/product/navie-confirm-ui-vscode.webp"/>

#### Add a new OpenAI Key <!-- omit in toc -->

In VS Code, open the Command Palette.

You can use a hotkey to open the VS Code Command Palette
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

Or you can select `View` -> `Command Palette`

<img class="video-screenshot" src="/assets/img/product/byok-command-palette.webp"/> 

Search for `AppMap Set OpenAPI Key`

<img class="video-screenshot" src="/assets/img/product/byok-search.webp"/> 

Paste your key into the new field and hit enter.

You'll get a notification in VS Code that your key is set. 

**NOTE:** You will need to reload your window for the setting to take effect. Use the Command Palette `Developer: Reload Window`

<img class="video-screenshot" src="/assets/img/product/byok-key-set.webp"/> 

#### Delete a configured OpenAI Key <!-- omit in toc -->

To delete your key, simply open the Command Palette

You can use a hotkey to open
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

Or you can select `View` -> `Command Palette`

<img class="video-screenshot" src="/assets/img/product/byok-command-palette.webp"/> 

Search for `AppMap Set OpenAPI Key`

<img class="video-screenshot" src="/assets/img/product/byok-search.webp"/> 

And simply hit enter with the field blank.  VS Code will notify you that the key has been unset.

**NOTE:** You will need to reload your window for the setting to take effect. Use the Command Palette `Developer: Reload Window`

<img class="video-screenshot" src="/assets/img/product/byok-key-erased.webp"/> 

#### How is my API key saved securely? <!-- omit in toc -->

For secure storage of API key secrets within AppMap, we use the default VS Code secret storage which leverages  Electron's safeStorage API to ensure the confidentiality of sensitive information. Upon encryption, secrets are stored within the user data directory in a SQLite database, alongside other VS Code state information. This encryption process involves generating a unique encryption key, which, on macOS, is securely stored within `Keychain Access` under "Code Safe Storage" or "Code - Insiders Safe Storage," depending on the version. This method provides a robust layer of protection, preventing unauthorized access by other applications or users with full disk access. The safeStorage API, accessible in the main process, supports operations such as checking encryption availability, encrypting and decrypting strings, and selecting storage backends on Linux. This approach ensures that your secrets are securely encrypted and stored, safeguarding them from potential threats while maintaining application integrity.

## Examples

### OpenAI

**Note:** We recommend configuring your OpenAI key using the code editor extension. Follow the [Bring Your Own Key](/docs/navie/bring-your-own-model.html#configuring-your-openai-key) docs for instructions.  

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

### LM Studio

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

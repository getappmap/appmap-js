---
layout: docs
title: Docs - Reference
description: "Reference Guide to AppMap Navie, including advanced usage and configuration"
toc: true
reference: true
name: AppMap Navie AI
step: 3
---

# AppMap Navie AI
- [Advanced Navie Commands](#advanced-navie-commands)
  - [`@explain`](#explain)
  - [`@help`](#help)
  - [`@generate`](#generate)
- [Bring Your Own Model Examples](#bring-your-own-model-examples)
  - [OpenAI](#openai)
  - [Azure OpenAI](#azure-openai)
  - [AnyScale Endpoints](#anyscale-endpoints)
  - [Ollama](#ollama)
  - [LM Studio](#lm-studio)
- [OpenAI Key Management in VS Code](#openai-key-management-in-vs-code)
  - [Add a new OpenAI Key in VS Code](#add-a-new-openai-key-in-vs-code)
  - [Delete a configured OpenAI Key](#delete-a-configured-openai-key)
  - [How is my API key saved securely?](#how-is-my-api-key-saved-securely)
- [OpenAI Key Management in JetBrains](#openai-key-management-in-jetbrains)
  - [Adding or Modifying OpenAI API Key in JetBrains](#adding-or-modifying-openai-api-key-in-jetbrains)
  - [How is my API key saved securely?](#how-is-my-api-key-saved-securely-1)
- [Accessing Navie Logs](#accessing-navie-logs)
  - [In VS Code](#in-vs-code)
  - [In JetBrains](#in-jetbrains)
- [GitHub Repository](#github-repository)

## Advanced Navie Commands

You can ask free-form questions, or start your question with one of these commands:

- [`@explain`](#explain)
- [`@help`](#help)
- [`@generate`](#generate)

### `@explain`

The `@explain` command prefix within Navie serves as a default option focused on helping you learn more about your project. Using the `@explain` prefix will focus the Navie AI response to be more explanatory and will dive into architectural level questions across your entire code base. You can also use this to ask for ways to improve the performance of a feature as well. 

#### Examples <!-- omit in toc -->

- @explain how does user authentication work in this project?
- @explain how is the export request for physical flows handled, and what are the tables involved?
- @explain how does the products listing page works and how can I improve the performance?

### `@help`

Navie will help you setup AppMap, including generating AppMap recordings and diagrams.  This prefix will focus the Navie AI response to be more specific towards help with using AppMap products and features.  This will leverage the [AppMap documentation](https://appmap.io/docs) as part of the context related to your question and provide guidance for using AppMap features or diving into advanced AppMap topics. 

#### Examples <!-- omit in toc -->

- @help how do I setup process recording for my node.js project?
- @help how can I reduce the size of my large AppMap Data recordings?
- @help how can i export my AppMap data to atlassian confluence? 


### `@generate`

The `@generate` prefix will focus the Navie AI response to optimize for new code creation.  This is useful when you want the Navie AI to respond with code implementations across your entire code base. This is useful for both creation of new code as well as creation of test cases. 

#### Examples <!-- omit in toc -->

- @generate Using the django-simple-captcha library add the necessary code for an offline captcha to my new user registration page.
- @generate Update the function for the physical flow export to include data type via physical_spec_data_type and physical_specification tables without changing the existing functionality.
- @generate Design and implement a cache key for user posts and show me how to implement it within this code base

## Bring Your Own Model Examples

### OpenAI

**Note:** We recommend configuring your OpenAI key using the code editor extension. Follow the [Bring Your Own Key](/docs/navie/bring-your-own-model.html#configuring-your-openai-key) docs for instructions.  

Only `OPENAI_API_KEY` needs to be set, other settings can stay default:

| `OPENAI_API_KEY`| `sk-9spQsnE3X7myFHnjgNKKgIcGAdaIG78I3HZB4DFDWQGM` |

When using your own OpenAI API key, you can also modify the OpenAI model for Navie to use.  For example if you wanted to use `gpt-3.5` or use an preview model like `gpt-4-vision-preview`.

| `APPMAP_NAVIE_MODEL`| `gpt-4-vision-preview` |

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

## OpenAI Key Management in VS Code

### Add a new OpenAI Key in VS Code 

The standard way to add an OpenAI API key in VS Code is to use the `gear` icon in the Navie chat window, but you can alternatively set the key using the VS Code Command Palette with an `AppMap` command option.

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

### Delete a configured OpenAI Key

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

### How is my API key saved securely?

For secure storage of API key secrets within AppMap, we use the default VS Code secret storage which leverages  Electron's safeStorage API to ensure the confidentiality of sensitive information. Upon encryption, secrets are stored within the user data directory in a SQLite database, alongside other VS Code state information. This encryption process involves generating a unique encryption key, which, on macOS, is securely stored within `Keychain Access` under "Code Safe Storage" or "Code - Insiders Safe Storage," depending on the version. This method provides a robust layer of protection, preventing unauthorized access by other applications or users with full disk access. The safeStorage API, accessible in the main process, supports operations such as checking encryption availability, encrypting and decrypting strings, and selecting storage backends on Linux. This approach ensures that your secrets are securely encrypted and stored, safeguarding them from potential threats while maintaining application integrity.

## OpenAI Key Management in JetBrains

The standard way to add an OpenAI API key in JetBrains is to use the `gear` icon in the Navie chat window, but you can alternatively set the key directly in the JetBrains settings. 

### Adding or Modifying OpenAI API Key in JetBrains

In JetBrains, open the `Settings` option. 

![Open View in VS Code](/assets/img/docs/jetbrains-settings-1.webp)

In the `Settings` window, search for `appmap` in the search bar on the side.  Under the `Tools -> AppMap` you will see a configuration option for your OpenAI API Key in the `AppMap Services` section.  This is the same section you are able to add/edit/modify your other environment settings for using your own custom models. 

![Open View in VS Code](/assets/img/docs/jetbrains-settings-2.webp)

### How is my API key saved securely?

AppMap follows JetBrains best practices for the storing of sensitive data. The AppMap JetBrains plugin uses the `PasswordSafe` package [to securely persist](https://www.jetbrains.com/help/idea/reference-ide-settings-password-safe.html) your OpenAI API key.  The default storage format for `PasswordSafe` is operating system dependent. Refer to the [JetBrains Developer Documents](https://plugins.jetbrains.com/docs/intellij/persisting-sensitive-data.html#storage) for more information. 

## Accessing Navie Logs

### In VS Code

You can access the Navie logs in VS Code by opening the `Output` tab and selecting `AppMap Services` from the list of available output logs.  

To open the Output window, on the menu bar, choose View > Output, or in Windows press `Ctrl+Shift+U` or in Mac use `Shift+Command+U`

![Open View in VS Code](/assets/img/docs/vscode-output-1.webp)

Click on the output log dropdown in the right corner to view a list of all the available output logs. 

![Open Output logs list](/assets/img/docs/vscode-output-2.webp)

Select on the `AppMap: Services` log to view the logs from Navie. 

![Select AppMap Services](/assets/img/docs/vscode-output-3.webp)

### In JetBrains

You can enable debug logging of Navie in your JetBrains code editor by first opening `Help` > `Diagnostic Tools` > `Debug Log Settings`. 

![JetBrains Debug Log menu](/assets/img/jetbrains-debug-logs.webp)  

In the `Custom Debug Log Configuration` enter `appland` to enable DEBUG level logging for the AppMap plugin. 

![JetBrains Debug Log Configuration](/assets/img/jetbrains-logging-configuration.webp)  

Next, open `Help` > `Show Log...` will open the IDE log file. 

![JetBrains Debug Show Log](/assets/img/jetbrains-show-log.webp)

## GitHub Repository

[https://github.com/getappmap/appmap](https://github.com/getappmap/appmap)

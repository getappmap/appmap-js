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
- [Navie Commands](#navie-commands)
  - [`@plan`](#plan)
  - [`@generate`](#generate)
  - [`@test`](#test)
  - [`@explain`](#explain)
  - [`@diagram`](#diagram)
  - [`@help`](#help)
  - [Navie Commands Demo](#navie-commands-demo)
- [Bring Your Own Model Examples](#bring-your-own-model-examples)
  - [GitHub Copilot Language Model](#github-copilot-language-model)
  - [OpenAI](#openai)
  - [Azure OpenAI](#azure-openai)
  - [AnyScale Endpoints](#anyscale-endpoints)
  - [Fireworks AI](#fireworks-ai)
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

## Navie Commands

You can ask free-form questions, or start your question with one of these commands:

- [`@plan`](#plan)
- [`@generate`](#generate)
- [`@test`](#test)
- [`@explain`](#explain)
- [`@diagram`](#diagram)
- [`@help`](#help)


### `@plan`

The `@plan` command prefix within Navie focuses the AI response on building a detailed implementation plan for the relevant query.  This will focus Navie on only understanding the problem and the application to generate a step-by-step plan. This will generally not respond with code implementation details, consider using the `@generate` command which can implement code based on the plan.

#### Examples <!-- omit in toc -->

- @plan improve the performance of my slow product listing page.  
- @plan implement a cache key for my user posting on my social media application.  
- @plan migrate the /users/setting API endpoint from SQL to MongoDB.  

#### `@plan` Video Demo <!-- omit in toc -->

{% include vimeo.html id='985121150' %}

### `@generate`

The `@generate` prefix will focus the Navie AI response to optimize for new code creation.  This is useful when you want the Navie AI to respond with code implementations across your entire code base. This will reduce the amount of code explanation and generally the AI will respond only with the specific files and functions that need to be changed in order to implement a specific plan.

#### Examples <!-- omit in toc -->

- @generate Using the django-simple-captcha library add the necessary code for an offline captcha to my new user registration page.
- @generate Update the function for the physical flow export to include data type via physical_spec_data_type and physical_specification tables without changing the existing functionality.
- @generate Design and implement a cache key for user posts and show me how to implement it within this code base

#### `@generate` Video Demo <!-- omit in toc -->

{% include vimeo.html id='985121150' %}

### `@test`

The `@test` command prefix will focus the Navie AI response to optimize for test case creation, such as unit testing or integration testing.  This prefix will understand how your tests are currently written and provide updated tests based on features or code that is provided.  You can use this command along with the `@generate` command to create tests cases for newly generated code.

#### Examples <!-- omit in toc -->

- @test create integration test cases for the user setting page that is migrated to mongodb.  
- @test create unit and integration tests that fully support the updated cache key functionality.  
- @test provide detailed test cases examples for testing the updated user billing settings dashboard.  

### `@explain`

The `@explain` command prefix within Navie serves as a default option focused on helping you learn more about your project. Using the `@explain` prefix will focus the Navie AI response to be more explanatory and will dive into architectural level questions across your entire code base. You can also use this to ask for ways to improve the performance of a feature as well. 

#### Examples <!-- omit in toc -->

- @explain how does user authentication work in this project?
- @explain how is the export request for physical flows handled, and what are the tables involved?
- @explain how does the products listing page works and how can I improve the performance?

### `@diagram`

The `@diagram` command prefix within Navie focuses the AI response to generate Mermaid compatable diagrams.  [Mermaid](https://mermaid.js.org/) is an open source diagramming and charting utility with wide support across tools such as GitHub, Atlassian, and more.  Use the `@diagram` command, and Navie will create and render a Mermaid compatable diagram within the Navie chat window.  You can open this diagram in the [Mermaid Live Editor](https://mermaid.live), copy the Mermaid Definitions to your clipboard, save to disk, or expand a full window view.  Save the Mermaid diagram into any supported tool such as GitHub Issues, Atlassian Confluence, and more. 

#### Example Questions <!-- omit in toc -->

```
@diagram the functional steps involved when a new user registers for the service.
```
  
<img class="video-screenshot" src="/assets/img/product/sequence-diagram-navie.webp"/> 
 
```
@diagram the entity relationships between products and other important data objects.
```

<img class="video-screenshot" src="/assets/img/product/entity-relationship-navie.webp"/> 

```
@diagram using a flow chart how product sales tax is calculated.
```

<img class="video-screenshot" src="/assets/img/product/flow-chart-navie.webp"/> 

```
@diagram create a detailed class map of the users, stores, products and other associated classes used
```

<img class="video-screenshot" src="/assets/img/product/class-map-navie.webp"/> 

#### Example Diagram Projects <!-- omit in toc -->

Below are a series of open source projects you can use to try out the `@diagram` feature using 
prebuilt AppMap data in a sample project. Simply clone one of the following projects, open 
into your code editor with the AppMap extension installed, and ask Navie to generate diagrams.

- [Sample Python Project](https://github.com/land-of-apps/python-diagram-example/blob/master/README.md)
- [Sample Ruby Project](https://github.com/land-of-apps/rails-diagram-example/blob/main/README.md)
- [Sample Node (MERN) Project](https://github.com/land-of-apps/mern-diagram-example/blob/master/README.md)
- [Sample Jave Spring Project](https://github.com/land-of-apps/waltz/blob/demo/diagram-examples/demo/diagram-demo.md)

### `@help`

Navie will help you setup AppMap, including generating AppMap recordings and diagrams.  This prefix will focus the Navie AI response to be more specific towards help with using AppMap products and features.  This will leverage the [AppMap documentation](https://appmap.io/docs) as part of the context related to your question and provide guidance for using AppMap features or diving into advanced AppMap topics. 

#### Examples <!-- omit in toc -->

- @help how do I setup process recording for my node.js project?
- @help how can I reduce the size of my large AppMap Data recordings?
- @help how can i export my AppMap data to atlassian confluence? 

## Bring Your Own Model Examples

### GitHub Copilot Language Model

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

#### Video Demo

{% include vimeo.html id='992238965' %}

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

#### Anyscale Demo with VS Code

{% include vimeo.html id='970914908' %}

#### Anyscale Demo with JetBrains

{% include vimeo.html id='970914884' %}

### Fireworks AI

You can use [Fireworks AI](https://fireworks.ai/) and their serverless or on-demand 
models as a compatible backend for AppMap Navie AI.

After creating an account on Fireworks AI you can configure your Navie environment
settings:

| `OPENAI_API_KEY` | `WBYq2mKlK8I16ha21k233k2EwzGAJy3e0CLmtNZadJ6byfpu7c` |
| `OPENAI_BASE_URL` | `https://api.fireworks.ai/inference/v1` |
| `APPMAP_NAVIE_MODEL` | `accounts/fireworks/models/mixtral-8x22b-instruct` |

Consult the [Fireworks AI documentation](https://fireworks.ai/models) for a full list of 
the available models they currently support. 

#### Video Demo

{% include vimeo.html id='992941358' %}

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

{% include vimeo.html id='969002308' %}

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

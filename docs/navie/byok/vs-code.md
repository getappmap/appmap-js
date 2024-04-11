---
layout: docs
title: Docs - Navie
name: Configuring environment in VS Code
step: 5
navie: true
toc: true
description: Configure AppMap services environment in VSCode
---


# Configuring environment in VS Code

Configure Navie to [use a specific LLM](/docs/navie/bring-your-own-model) by adjusting the environment variables used by the AppMap extension.

- [Editing AppMap services environment](#editing-appmap-services-environment)
- [Add a new OpenAI Key](#add-a-new-openai-key)
- [Delete a configured OpenAI Key](#delete-a-configured-openai-key)
- [Check the status of your OpenAI key](#check-the-status-of-your-openai-key)
- [How is my API key saved securely?](#how-is-my-api-key-saved-securely)

## Editing AppMap services environment

**Note**: To store the API key securely, follow [the instructions below](#add-a-new-openai-key).

In VS Code, go to settings.

<img class="video-screenshot" src="/assets/img/docs/goto-vscode-settings.webp" alt="a screenshot of the Visual Studio Code menu"/>

 Search for “appmap environment” to reveal “AppMap: Command Line Environment” setting.

<img class="video-screenshot" alt="a screenshot of the AppMap: Command Line Environment settings section" src="/assets/img/docs/search-for-appmap-environment.webp"/>

Use *Add Item* to define the relevant environment variables according to the [BYOM documentation](/docs/navie/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot showing an example of the bring your own model key value entry" src="/assets/img/docs/byom-key-value-example.webp"/>

Reload your VS Code for the changes to take effect.  

**NOTE:** Please follow the instructions below to set `OPENAI_API_KEY` or `AZURE_OPENAI_API_KEY` securely.

## Add a new OpenAI Key

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

## Delete a configured OpenAI Key

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

## Check the status of your OpenAI key

To check if you are using the AppMap hosted proxy or your own API Key open the Command Palette.

You can use a hotkey to open
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

Or you can select `View` -> `Command Palette`

<img class="video-screenshot" src="/assets/img/product/byok-command-palette.webp"/> 

Search for `Check Key Status`

<img class="video-screenshot" src="/assets/img/product/byok-check-status.webp"/> 

Select `Check OpenAI API Key Status`

The code editor will respond a notifiction in the bottom corner with your latest status.

<img class="video-screenshot" src="/assets/img/product/byok-check-status-resp.webp"/> 


## How is my API key saved securely?

For secure storage of API key secrets within AppMap, we use the default VS Code secret storage which leverages  Electron's safeStorage API to ensure the confidentiality of sensitive information. Upon encryption, secrets are stored within the user data directory in a SQLite database, alongside other VS Code state information. This encryption process involves generating a unique encryption key, which, on macOS, is securely stored within `Keychain Access` under "Code Safe Storage" or "Code - Insiders Safe Storage," depending on the version. This method provides a robust layer of protection, preventing unauthorized access by other applications or users with full disk access. The safeStorage API, accessible in the main process, supports operations such as checking encryption availability, encrypting and decrypting strings, and selecting storage backends on Linux. This approach ensures that your secrets are securely encrypted and stored, safeguarding them from potential threats while maintaining application integrity.

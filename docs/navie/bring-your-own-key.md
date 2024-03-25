---
layout: docs
title: Docs - AppMap Navie
name: Bring Your Own Key
step: 4
navie: true
toc: true
---

# Bring Your Own Key (BYOK)

By default, when asking a question to Navie, your code editor will interact with the AppMap hosted proxy for OpenAI.  If you have a requirement to bring your own key or otherwise use your own OpenAI account you can follow these steps to update the OpenAI key.  Refer to the Navie Docs for more details about [Navie technical architecture](/docs/navie/how-navie-works).

- [Add a new OpenAI Key](#add-a-new-openai-key)
- [Delete a configured OpenAI Key](#delete-a-configured-openai-key)
- [Check the status of your OpenAI key](#check-the-status-of-your-openai-key)
- [FAQs](#faqs)
  - [How is my API key saved securely?](#how-is-my-api-key-saved-securely)

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


# FAQs

## How is my API key saved securely?

For secure storage of API key secrets within AppMap, we use the default VS Code secreat storage which leverages  Electron's safeStorage API to ensure the confidentiality of sensitive information. Upon encryption, secrets are stored within the user data directory in a SQLite database, alongside other VS Code state information. This encryption process involves generating a unique encryption key, which, on macOS, is securely stored within Keychain Access under "Code Safe Storage" or "Code - Insiders Safe Storage," depending on the version. This method provides a robust layer of protection, preventing unauthorized access by other applications or users with full disk access. The safeStorage API, accessible in the main process, supports operations such as checking encryption availability, encrypting and decrypting strings, and selecting storage backends on Linux. This approach ensures that your secrets are securely encrypted and stored, safeguarding them from potential threats while maintaining application integrity.






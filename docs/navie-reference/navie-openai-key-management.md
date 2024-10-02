---
layout: docs
title: Docs - AppMap Navie
description: "Reference Guide to AppMap Navie AI, OpenAI Key Management."
name: OpenAI Key Management
navie-reference: true
toc: true
step: 6
---

# OpenAI Key Management

## Visual Studio Code

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

## JetBrains

The standard way to add an OpenAI API key in JetBrains is to use the `gear` icon in the Navie chat window, but you can alternatively set the key directly in the JetBrains settings. 

### Adding or Modifying OpenAI API Key in JetBrains

In JetBrains, open the `Settings` option. 

![Open View in VS Code](/assets/img/docs/jetbrains-settings-1.webp)

In the `Settings` window, search for `appmap` in the search bar on the side.  Under the `Tools -> AppMap` you will see a configuration option for your OpenAI API Key in the `AppMap Services` section.  This is the same section you are able to add/edit/modify your other environment settings for using your own custom models. 

![Open View in VS Code](/assets/img/docs/jetbrains-settings-2.webp)

### How is my API key saved securely?

AppMap follows JetBrains best practices for the storing of sensitive data. The AppMap JetBrains plugin uses the `PasswordSafe` package [to securely persist](https://www.jetbrains.com/help/idea/reference-ide-settings-password-safe.html) your OpenAI API key.  The default storage format for `PasswordSafe` is operating system dependent. Refer to the [JetBrains Developer Documents](https://plugins.jetbrains.com/docs/intellij/persisting-sensitive-data.html#storage) for more information. 

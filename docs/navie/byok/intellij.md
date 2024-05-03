---
layout: docs
title: Docs - Navie
name: Configuring environment in IntelliJ
step: 5
navie: true
toc: true
description: Configure AppMap services environment in IntelliJ
---

# Configuring environment in IntelliJ

Configure Navie to [use a specific LLM](/docs/navie/bring-your-own-model) by adjusting the environment variables used by the AppMap extension.

<p class="alert alert-info">
<b>This feature is in early access.</b> It might not be available in the generally available AppMap IntelliJ plugin yet. If you don't see it, please make sure to update and check back soon.
</p>

In IntelliJ, go to settings.

<img class="video-screenshot" alt="a screenshot of the IntelliJ menu" src="/assets/img/docs/goto-intellij-settings.webp" />

Go to *Tools* → *AppMap*.

<img class="video-screenshot" alt="a screenshot of the AppMap settings in IntelliJ" src="/assets/img/docs/intellij-tools-appmap-settings.webp"/>

Enter the environment editor.
<img class="video-screenshot" alt="a screenshot of the entering the AppMap environment editor in IntelliJ" src="/assets/img/docs/intellij-enter-env-editor.webp"/>

Use the editor to define the relevant environment variables according to the [BYOM documentation](/docs/navie/bring-your-own-model#configuration).

<img class="video-screenshot" alt="a screenshot of the environment editor in IntelliJ" src="/assets/img/docs/intellij-env-editor.webp" />

Reload your IDE for the changes to take effect.  


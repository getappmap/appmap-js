---
layout: docs
title: Docs - Reference
description: "Install your AppMap license key for VS Code and JetBrains by following these steps."
toc: true
reference: true
step: 18
name: License Key Installation
---

# AppMap Code Editor license key installation

After receiving your AppMap license key follow the steps below. 

For the license key to successfully validate with AppMap systems ensure your machine is able to connect to <a href="https://getappmap.com">https://getappmap.com</a>. You can test by opening it in your web browser.

- [VS Code license key install steps](#vs-code-license-key-install-steps)
- [JetBrains license key install steps](#jetbrains-license-key-install-steps)

## VS Code license key install steps

1) Open the VS Code Command Palette
   - Mac: `Cmd + Shift + P`
   - Windows/Linux: `Ctrl + Shift + P`

2) Search for `AppMap license`

<img class="video-screenshot" src="/assets/img/license-key-vscode-1.webp"/> 

3) Enter the license key provided by the AppMap team and press `Enter` to submit

<img class="video-screenshot" src="/assets/img/license-key-vscode-2.webp"/> 

4) Click `Allow` to allow the AppMap extension to use your license key.

<img class="video-screenshot" src="/assets/img/license-key-vscode-3.webp"/> 

5) AppMap will be activated for Visual Studio Code.

<br/>

## JetBrains license key install steps

1) Select `Tools` from the main menu of your JetBrains Code Editor. Then select `AppMap` -> `Enter License Key`.

<img class="video-screenshot" src="/assets/img/license-key-jetbrains-1.webp"/> 

2) Enter the license key provided by the AppMap team and press `Ok` to submit.

<img class="video-screenshot" src="/assets/img/license-key-jetbrains-2.webp"/> 

3) You will now be logged into AppMap for the IDE.

<img class="video-screenshot" src="/assets/img/license-key-jetbrains-3.webp"/> 

### Video: How to Install an AppMap license key in JetBrains

<div class="video-container" onclick="JetBrainsplayVideo()">
  <img id="JetBrainsvideoPlaceholder" src="/assets/img/appmap-license-jetbrains-placeholder.webp" style="display:block; width: 100%;">
  <video id="JetBrainsvideoPlayer" playsinline loop style="display:none;">
    <source src="/assets/video/appmap-license-key-jetbrains.webm" type="video/webm">
    <source src="/assets/video/appmap-license-key-jetbrains.mp4" type="video/mp4">
  </video>
</div>

<script>
  function JetBrainsplayVideo() {
    var video = document.getElementById('JetBrainsvideoPlayer');
    var placeholder = document.getElementById('JetBrainsvideoPlaceholder');
    placeholder.style.display = 'none';
    video.style.display = 'block';
    video.play();
  }
</script>
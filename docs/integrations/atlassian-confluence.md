---
layout: docs
title: Docs - Integrations
description: "AppMap integrates with Atlassian Confluence to generate interactive software diagrams from run-time data, enhancing documentation and collaboration on software projects."
integrations: true
name: Atlassian Confluence
step: 1
---

# Atlassian Confluence

AppMap integrates with [Confluence](https://www.atlassian.com/software/confluence), the popular corporate wiki developed by the Atlassian.

Confluence facilitates robust documentation and knowledge sharing. AppMap automatically generates interactive software diagrams from run-time data, ensuring an accurate and up-to-date understanding of code architecture and behavior. This integration leverages the strengths of both platforms enabling teams to better understand, document, and collaborate on their software projects.

## Requirements

1. A project containing AppMap Data.
  - How to make AppMap Diagrams [in your code editor](/docs/get-started-with-appmap/)
  - How to make AppMap Diagrams [using a GitHub action](/docs/integrations/github-actions) or in [CircleCI](/docs/integrations/circle-ci)
2. [The AppMap app for Confluence](https://marketplace.atlassian.com/apps/1233075/appmap-for-confluence). 

## Add AppMap Diagrams to a Document or Blog Post

1. **Enter Edit Mode:** Click the pencil icon to switch to Edit Mode in Confluence.
  <img class="video-screenshot" src="/assets/img/enter-edit-mode.png"/> 

2. **Attach AppMap File:** Drag and drop the AppMap file from your file system or Finder into the Confluence page.
  <img class="video-screenshot" src="/assets/img/drag-and-drop-appmap.webp"/> 

3. **Insert AppMap:** Click the plus sign to get the insert menu. Type in and select 'AppMap'.
  <img class="video-screenshot" src="/assets/img/insert-appmap.webp"/> 
  A placeholder that looks like this will be added to the page: 
  <img class="video-screenshot" src="/assets/img/appmap-placeholder-confluence.png"/>

4. **Choose AppMap:** Click the pencil under the placeholder to open the AppMap options.
  <img class="video-screenshot" src="/assets/img/edit-menu-confluence.png"/>
   Select the AppMap you want to display from the dropdown menu and it will render.
  <img class="video-screenshot" src="/assets/img/select-an-appmap-confluence.webp"/>
    <p class="alert alert-info">  If your AppMap does not render, make sure that you are working on a published document. AppMap Diagrams will not render until the document has been published at least once</p>

5. **Adjust Width (Optional)** The width adjustment controls at the bottom of the AppMap window can be used to view more of the AppMap inline.
  <img class="video-screenshot" src="/assets/img/width-adjustments-confluence.png"/>

6. **Save Changes:** Click the 'Update' button to apply the changes to your Confluence page.
  <img class="video-screenshot" src="/assets/img/update-button-confluence.png"/>

7. **Fullscreen Mode (Optional):** Click on the 'full screen' icon in the AppMap use Fullscreen mode.
  <img class="video-screenshot" src="/assets/img/full-screen-control-confluence.png"/>
    <p class="alert alert-info"> If at any point you would like some help, <strong><a href="/slack">join us in Slack</a>!</strong> You'll find the AppMap team there, along with other AppMap users.</p>


---
layout: docs
title: Docs - Integrations
description: "Learn how to record AppMap Data inside a Docker container for consistent, reproducible environments across various operating systems, enhancing code quality and collaboration."
integrations: true
name: Docker
step: 7
---

# Docker

AppMap supports capturing AppMap recordings from inside a Docker container, when using [Docker Compose](https://docs.docker.com/compose/), or when running [Docker Desktop](https://www.docker.com/products/docker-desktop/).

- [Why record AppMap Data within Docker?](#why-record-appmap-data-within-docker)
- [Sample Project](#sample-project)
- [How to run AppMap inside of Docker Engine](#how-to-run-appmap-inside-of-docker-engine)
- [How to run AppMap inside of Docker Compose](#how-to-run-appmap-inside-of-docker-compose)
- [Troubleshooting AppMap and Docker](#troubleshooting-appmap-and-docker)

## Why record AppMap Data within Docker?

Recording AppMap Data inside a Docker container offers several advantages for developers. Docker's containerization ensures a consistent, reproducible environment across various operating systems, which is crucial for diagnosing and resolving issues that may be environment-specific. This uniformity simplifies the setup process, reduces the time spent on environment configuration, and increases the reliability of recorded AppMap Diagrams by mirroring the conditions under which software runs in production or other developers' environments. 

Overall, using Docker for recording AppMap Data streamlines the development workflow, enhances code quality, and fosters collaboration among team members by ensuring that everyone works within an identical development setup.

## Sample Project

To see an example project using Docker and configured with AppMap, you can see the necessary configuration available on our [sample project on GitHub](https://github.com/land-of-apps/sample_rails_app/).

- [Example Dockerfile](https://github.com/land-of-apps/sample_rails_app/blob/main/Dockerfile)  
- [Example docker-compose.yml](https://github.com/land-of-apps/sample_rails_app/blob/main/docker-compose.yml)

## How to run AppMap inside of Docker Engine

Using the example [Dockerfile](https://github.com/land-of-apps/sample_rails_app/blob/main/Dockerfile) above you need to make sure that you run Docker with the `-v` or `--volume` options in `docker run`.

For example to run the application with AppMap enabled in the sample project above, you will need to run:

```
> docker run -p 3000:3000 -v $(pwd)/tmp/appmap:/app/tmp/appmap sample_rails_docker bundle exec rails server -b 0.0.0.0
```
{: .example-code}

Let's breakdown what that command is doing:

- `docker run`: Command to create and start a new container.  
- `-p 3000:3000`: Maps port 3000 on the host to port 3000 in the container.  
- `-v $(pwd)/tmp/appmap:/app/tmp/appmap`: Mounts the tmp/appmap directory from the current directory on the host to /app/tmp/appmap in the container for file sharing.  
**NOTE** Update `/app/` in the command to where your application is configured to run.  
- `sample_rails_docker`: The name of the Docker image to use for the container.  
- `bundle exec rails server -b 0.0.0.0`: The command executed within the container to start the application.  

After recording your AppMap Data, you'll now see them in the VS Code or JetBrains extension.  The maps will also be visible in your local directory in the `tmp/appmap` folder.  

<img class="video-screenshot" src="/assets/img/docs/guides/docker-appmaps.webp"/> 

## How to run AppMap inside of Docker Compose

Using the example [docker-compose.yml](https://github.com/land-of-apps/sample_rails_app/blob/main/docker-compose.yml) file in our sample project. Here is the relevant part of the config.

```
services:
  web:
    build: .
    command: bundle exec rails server -b 0.0.0.0
    ports:
      - "3000:3000"
    volumes:
      - ./tmp/appmap:/app/tmp/appmap
```
{: .example-code}

Let's explain the main part of our relevant configuration.

services: Defines the services that make up your application.

- `web`: The name of the first (and in this case, only) service.  
- `build: .`: Tells Docker to build the Docker image for the web service using the Dockerfile in the current directory.  
- `command: bundle exec rails server -b 0.0.0.0`: Overrides the default command to start the Rails server, making it accessible from any IP address.  
- `ports: "3000:3000"`: Maps port 3000 on the host to port 3000 in the container, allowing access to the application via localhost:3000.  
- `volumes: ./tmp/appmap:/app/tmp/appmap`: Mounts the tmp/appmap directory from the host into the container at /app/tmp/appmap for file sharing.  
**NOTE** Update `/app/` in the command to where your application is configured to run.  

You can now run `docker compose up web` to launch this container using Docker Compose.  When interacting with the application your maps will be displayed in the VS Code or JetBrains plugin.  The maps will also be visible in your local directory in the `tmp/appmap` folder.  

<img class="video-screenshot" src="/assets/img/docs/guides/docker-file-share.webp"/> 


## Troubleshooting AppMap and Docker

### AppMap Diagrams are not visible in plugin with directory correctly mounted <!-- omit in toc -->

You may experience an issue on Linux where you have correctly bind mounted the `tmp/appmap` directory into your Docker container, but are still unable to see the AppMap Diagrams in your project.  

<img class="video-screenshot" src="/assets/img/docs/guides/docker-no-appmaps.webp"/>

You can confirm this by looking in the `tmp/appmap` directory in your project file directory listing like in the screenshot below:

<img class="video-screenshot" src="/assets/img/docs/guides/docker-maps-directory.webp"/> 

You can see in that screenshot, a list of AppMap files are visible, and if we opened them in the editor, they would be visible as an AppMap.

<img class="video-screenshot" src="/assets/img/docs/guides/docker-open-map.webp"/> 

When using Docker on Linux, developers might encounter a situation where directories mounted inside a Docker container as bind mounts (using the -v or --volume flag) are owned by the root user. This happens because, by default, Docker runs its containers as the root user, unless specified otherwise. As a result, any files or directories created inside the container on these bind mounts will also be owned by root.  Because the AppMap files in `tmp/appmap` are now owned as the `root` user, the AppMap editor extension is unable to index them, which is necessary for them to be visible in the code editor extension.

We recommend reviewing the [Docker official documentation regarding bind mounts](https://docs.docker.com/storage/bind-mounts/) for the most up to date information on the permission settings for linux bind mounts.  

As a Linux user, make sure that the user/group you are running VS Code as also has write access.  For more info, refer to [this blog post](https://techflare.blog/permission-problems-in-bind-mount-in-docker-volume/) which goes into detail about Linux, Docker, and file permissions.
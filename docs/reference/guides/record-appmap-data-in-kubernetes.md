---
layout: docs
guides: true
title: Docs - Guides
description: "Learn the settings required to record and access AppMap data of your application running in Kubernetes/minikube."
step: 10
name: Record AppMap Data in Kubernetes
---

# Record AppMap Data in Kubernetes/minikube

If you use [minikube](https://minikube.sigs.k8s.io/docs/) to run your application locally for testing and development, you can create and access AppMap data by mounting a volume into your minikube host and making this volume available to your Kubernetes application pod.  

If you are unable to mount a directory using minikube, or if your Kubernetes cluster is running remotely in a dev or test environment, you can use alternative techniques such as `kubectl cp` to copy AppMap data from a pod to your local machine for analysis, or you can leverage [Remote Recording](/docs/get-started-with-appmap/making-appmap-data.html#with-remote-application-recording) of your application instead.

- [AppMap and minikube Setup](#appmap-and-minikube-setup)
  - [AppMap and minikube Architecture](#appmap-and-minikube-architecture)
  - [Mount AppMap Data Directory into minikube Host](#mount-appmap-data-directory-into-minikube-host)
  - [Connect Shared Volume into Application Pod via hostPath](#connect-shared-volume-into-application-pod-via-hostpath)
    - [Add `volumeMounts` Configuration](#add-volumemounts-configuration)
    - [Add a `hostPath` Volume to the Pod](#add-a-hostpath-volume-to-the-pod)
  - [Updated deployment.yml File Example](#updated-deploymentyml-file-example)
  - [Video Demonstration](#video-demonstration)
- [Add and Enable AppMap within your Application Pod Configuration](#add-and-enable-appmap-within-your-application-pod-configuration)
- [Remote Record Application within Kubernetes Pod](#remote-record-application-within-kubernetes-pod)
  - [Video Demonstration](#video-demonstration-1)
- [Copy AppMap Data from Application Pod to Local Machine](#copy-appmap-data-from-application-pod-to-local-machine)

## Appmap and minikube Setup

### AppMap and minikube Architecture

![AppMap and minikube Architecture](/assets/img/docs/appmap-kubernetes-minikube.webp)

### Mount AppMap Data Directory into minikube Host

To get direct access to your AppMap data from within your Code Editor with the AppMap plugin you need to use the [minikube mount](https://minikube.sigs.k8s.io/docs/handbook/mount/) command to map the `tmp/appmap` directory in your project into your minikube virtual machine.

<p class="alert alert-warning"><b>Note:</b> Mount this directory <b>before</b> you deploy your application pod to ensure the application can write into directory mount.</p>


Refer to the [minikube mount](https://minikube.sigs.k8s.io/docs/handbook/mount/) documentation for more details and requirements about this feature.  

From your local machine, run the following command to map your local AppMap directory to a directory on your minikube host. 
```shell
$ minikube mount <Local AppMap Dir>:<Remote minikube Dir>
```
{: .example-code}

For example, to mount my `tmp/appmap` directory from my local project to the `/appmap-host` directory

```
$ minikube mount tmp/appmap:/appmap-host 
📁  Mounting host path tmp/appmap into VM as /appmap-host ...
    ▪ Mount type:   9p
    ▪ User ID:      docker
    ▪ Group ID:     docker
    ▪ Version:      9p2000.L
    ▪ Message Size: 262144
    ▪ Options:      map[]
    ▪ Bind Address: 127.0.0.1:50300
🚀  Userspace file server: ufs starting
✅  Successfully mounted tmp/appmap to /appmap-host

📌  NOTE: This process must stay alive for the mount to be accessible ...
```
{: .example-code}

### Connect Shared Volume into Application Pod via hostPath

After you have completed the previous step and mounted your local AppMap data directory into the minikube host, update your pod's deployment file with a new `volumeMounts` configuration as well as a [hostPath](https://kubernetes.io/docs/concepts/storage/volumes/#hostpath) volume.

#### Add `volumeMounts` Configuration

In the `containers` section of the pod's deployment file, add or append to the `volumeMounts` section with the full path to the AppMap directory within your application's working directory.

```yaml
volumeMounts:
  - name: appmap-dir
    mountPath: <Your application working directory>/tmp/appmap
```
{: .example-code}

For example, if your application is running in `/usr/src/app`, set the `mountPath` to `/usr/src/app/tmp/appmap`.  

Example:

```yaml
volumeMounts:
  - name: appmap-dir
    mountPath: /usr/src/app/tmp/appmap
```
{: .example-code}

#### Add a `hostPath` Volume to the Pod

With the `volumeMounts` configuration added to your pod's deployment file, now add or append to your `volumes` section connecting the volume mount to the minikube host. Use the same directory you defined in the [previous section](#mount-appmap-data-dir-into-minikube-host) using the `minikube mount` command

```yaml
volumeMounts:
  - name: appmap-dir
    mountPath: <Remote minikube Dir>
```
{: .example-code}

For example, in the `minikube mount` command we mounted the `tmp/appmap` dir to the `/appmap-host` directory within our minikube host. We'll set the `mountPath` equal to the `/appmap-host` directory.

```yaml
volumeMounts:
  - name: appmap-dir
    mountPath: /appmap-host
```
{: .example-code}

### Updated deployment.yml File Example

For a fully working example project example, refer to the [AppMap GitHub repo](https://github.com/land-of-apps/django-k8s-template).

```diff
apiVersion: apps/v1
kind: Deployment
spec:
  replicas: 1
    spec:
      containers:
        - name: django
          image: petecheslock/django_oscar:latest
          imagePullPolicy: Always
          command: ["/bin/sh"]
          args: ["-c", "python appmap-python sandbox/manage.py runserver 0.0.0.0:8000"]
          ports:
            - containerPort: 8000
          envFrom:
            - configMapRef:
                name: django-config
          resources:
            limits:
              memory: 512Mi
              cpu: "250m"
            requests:
              memory: 512Mi
              cpu: "250m"

+          volumeMounts:
+            - name: appmap-dir
+              mountPath: /usr/src/app/tmp/appmap
+
+      volumes:
+        - name: appmap-dir
+          hostPath:
+            path: /appmap-host
```
{: .example-code}

### Video Demonstration

{% include vimeo.html id='1026968800' %}

## Add and Enable AppMap within your Application Pod Configuration

For more information about how to enable your application to create AppMap data, follow the [AppMap documentation](/docs/get-started-with-appmap/making-appmap-data) based on your language and framework.

After adding the AppMap software libraries and other necessary configurations to your application, redeploy your pod with AppMap enabled.  After your application starts, use the `minikube tunnel` command to make a connection to your `LoadBalancer` services to allow ingress network connections to your application.  Refer to the [minikube documentation](https://minikube.sigs.k8s.io/docs/commands/tunnel/) for more details and configuration settings for the `tunnel` command. 


## Remote Record Application within Kubernetes Pod

If you are unable to mount a local directory from your machine into your minikube host, you can alternatively run a [Remote Recording](/docs/get-started-with-appmap/making-appmap-data.html#with-remote-application-recording) of your application to generate AppMap Data.  

To learn more how Remote Recording works with your application, refer to the [AppMap documentation](/docs/get-started-with-appmap/making-appmap-data.html#with-remote-application-recording) with language specific setup details.  

### Video Demonstration

{% include vimeo.html id='973082886' %}

## Copy AppMap Data from Application Pod to Local Machine

If you are unable to mount a local directory from your machine into your minikube host you can copy files using the `kubectl cp` command from the container(s) in your application pod to your local machine into the `tmp/appmap` directory in your project.  

First, get the name of the pod you wish to copy files from.  Run the `kubectl get pods` to see a list of available pods. 

```
$ kubectl get pods
NAME                        READY   STATUS    RESTARTS   AGE
django-d84f99988-5hvck      1/1     Running   0          62s
my-nginx-5cd6fb64d5-c86t6   1/1     Running   0          62s
my-nginx-5cd6fb64d5-c8wsm   1/1     Running   0          62s
postgres-64ff95ff77-8hk2m   1/1     Running   0          62s
redis-676d779f49-vnsvf      1/1     Running   0          62s
```
{: .example-code}

Then, use the `kubectl cp` commmand to copy the files to your local `tmp/appmap` directory.

```
$ kubectl cp <Namespace>/<Pod Name>:<Remote AppMap Data Dir> <Local AppMap Dir>
```
{: .example-code}


For example, to copy all of the generated AppMap data from the `Django` pod in the example above, run the following command.

```
$ kubectl cp default/django-7f4dbc8d58-z4xwl:/usr/src/app/tmp/appmap ./tmp/appmap 
```
{: .example-code}

Refer to the [Kubernetes documentation](https://kubernetes.io/docs/reference/kubectl/generated/kubectl_cp/) for more details and advanced options for the `kubectl cp` command. 
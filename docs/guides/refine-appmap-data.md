---
layout: docs
title: Docs - Guides
description: "Optimize AppMap Diagrams by refining recordings to exclude noise. Start with inclusive config, analyze stats, update config, create concise AppMap Diagrams."
guides: true
name: Refining AppMap Data
step: 6
redirect_from: [/docs/reference/refine-appmaps, /docs/guides/refine-appmaps]
---

# Refining AppMap Data <!-- omit in toc -->

When you initially create a client configuration, it can be hard to know what classes to
include. Most often, you will simply select everything just to see what a recording looks
like. The resulting AppMap Diagrams can be quite large and noisy. The presence of calls to many
utility methods makes it hard to understand the bigger picture.

To refine your recordings, it's best to start with the smallest use-case that's
representative of the entire application. For example, while a single unit test will
produce a small recording, such tests typically avoid accessing external resources
(e.g. web services, a database, or the file system) for the sake of speed. Recording a
single functional or integration test is a better choice.

Once you've made a recording of a use-case, you can use the `stats` subcommand
of the [AppMap CLI](/docs/reference/appmap-client-cli.html).
tools to generate some simple statistics about your AppMap Data. Based on these statistics,
you will be able to update your configuration so that less-interesting methods are
excluded. When new recordings are created with the improved configuration, they will be
more concise and easier to understand.

To illustrate the refinement process, we'll look at a recording made for
[Jenkins](https://github.com/land-of-apps/jenkins). [CONTRIBUTING.md](https://github.com/land-of-apps/jenkins/blob/master/CONTRIBUTING.md#testing-changes)
in that repository mentions that there are functional tests in the `test` module. For this
example, we'll use the tests in
[test/src/test/java/hudson/model/DirectlyModifiableViewTest.java](https://github.com/land-of-apps/jenkins/blob/master/test/src/test/java/hudson/model/DirectlyModifiableViewTest.java).

- [Step 1: Make a recording with an inclusive configuration](#step-1-make-a-recording-with-an-inclusive-configuration)
- [Step 2: Eliminate the noise](#step-2-eliminate-the-noise)
- [Step 3: Update the configuration and create new AppMap Diagrams](#step-3-update-the-configuration-and-create-new-appmap-diagrams)

## Step 1: Make a recording with an inclusive configuration

We'll start with a very broad configuration specified in
`appmap.yml`:

```yaml
name: Jenkins
packages:
- path: org.acegisecurity.context
- path: hudson
- path: jenkins
```
{: .example-code}

These are the three top-level packages used by Jenkins. We include them to make sure all
calls to methods that might be interesting get recorded.

Running the tests in `DirectlyModifiableViewTest.java` produces five very large AppMap Diagrams:

```
% mvn test -Dtest=DirectlyModifiableViewTest
...
% ls -lsh | sort -n
total 310312
 11456 -rw-r--r--  1 ajp  staff   5.6M Nov 11 10:04 hudson_model_DirectlyModifiableViewTest_manipulateViewContent.appmap.json
 32952 -rw-r--r--  1 ajp  staff    16M Nov 11 10:04 hudson_model_DirectlyModifiableViewTest_doAddJobToView.appmap.json
 41240 -rw-r--r--  1 ajp  staff    20M Nov 11 10:04 hudson_model_DirectlyModifiableViewTest_doRemoveJobFromView.appmap.json
109864 -rw-r--r--  1 ajp  staff    53M Nov 11 10:04 hudson_model_DirectlyModifiableViewTest_doAddNestedJobToRecursiveView.appmap.json
114800 -rw-r--r--  1 ajp  staff    56M Nov 11 10:05 hudson_model_DirectlyModifiableViewTest_failWebMethodForIllegalRequest.appmap.jso
```

The statistics for these show that there's substantial noise in them:

```
% appmap stats tmp/appmap
232356 calls, top 20 methods
  hudson.util.AdaptedIterator#hasNext:50: 30433 (1 distinct)
  hudson.util.Iterators$5#hasNext:295: 30433 (1 distinct)
  hudson.ExtensionComponent#getInstance:73: 25040 (1 distinct)
  hudson.util.AdaptedIterator#next:54: 24779 (1 distinct)
  hudson.util.Iterators$5#next:299: 24779 (1 distinct)
  jenkins.model.Jenkins$3#getInstance:763: 8101 (1 distinct)
  jenkins.security.stapler.StaticRoutingDecisionProvider#decide:85: 7913 (1838 distinct)
  jenkins.model.Jenkins#getExtensionList:2702: 5963 (15 distinct)
  hudson.ExtensionList#iterator:172: 5849 (1 distinct)
  hudson.util.Iterators.readOnly:293: 5849 (5849 distinct)
  hudson.ExtensionList.lookup:433: 5831 (14 distinct)
  hudson.ExtensionList#size:191: 5452 (1 distinct)
  jenkins.security.stapler.DoActionFilter#keep:54: 2445 (2445 distinct)
  jenkins.security.stapler.TypedFilter#keep:193: 2352 (2352 distinct)
  jenkins.model.Jenkins.get:775: 1702 (1 distinct)
  hudson.util.RobustReflectionConverter$1#visit:193: 1517 (122 distinct)
  hudson.util.RobustReflectionConverter$2#visit:211: 1517 (122 distinct)
  hudson.util.xstream.MapperDelegate#getConverterFromItemType:103: 1517 (28 distinct)
  hudson.util.xstream.MapperDelegate#getConverterFromItemType:123: 1517 (73 distinct)
  hudson.util.xstream.MapperDelegate#getConverterFromItemType:95: 1517 (67 distinct)
```

The top 20 methods in these files are called more than 1500 times! Removing them from the
recordings will make the AppMap Diagrams easier to understand, without eliminating any
interesting information.

## Step 2: Eliminate the noise

We'll start by generating more detailed statistics:

```sh
% appmap stats --limit 0 --files --json tmp/appmap > jenkins-unfiltered-stats.json
```
{: .example-code}

The output will contain statistics for all calls in all files, formatted as JSON.

Next, examine the statistics to look for methods that can be considered for exclusion:

```
% jq -r '.totals[] | select(.calls > 75) | "  - \(.method)"' jenkins-unfiltered-stats.json | sort | uniq > exclusions.yml
% grep hudson exclusions.yml | head -5
  - hudson.ExpressionFactory2#createExpression
  - hudson.ExpressionFactory2$JellyJexlContext#getVars
  - hudson.ExpressionFactory2$JellyMap#get
  - hudson.ExpressionFactory2$JexlExpression#evaluate
  - hudson.ExtensionComponent#getInstance
% grep jenkins exclusions.yml | head -5
  - jenkins.MetaLocaleDrivenResourceProvider#lookup
  - jenkins.model.Jenkins#getACL
  - jenkins.model.Jenkins#getAuthorizationStrategy
  - jenkins.model.Jenkins#getCrumbIssuer
  - jenkins.model.Jenkins#getDescriptor
```

This finds methods that are called more than 75 times and saves them in a useful
form. Sorting them makes them easier to include in `appmap.yml`. Duplicate
method names will appear in the recording because of method overloading, but it's not
necessary to list them separately in the configuration. They can be removed.

Note that there's nothing special about the 75-call threshold used to select calls for
exclusion. Depending on your application, a different value may produce better results.

## Step 3: Update the configuration and create new AppMap Diagrams

The new configuration in `appmap.yml` gets updated to look like this:

```
name: Jenkins
packages:
- path: org.acegisecurity.context
  exclude:
  - org.acegisecurity.context.SecurityContextHolder.setContext
  - org.acegisecurity.context.SecurityContextImpl#getAuthentication
  - org.acegisecurity.context.ThreadLocalSecurityContextHolderStrategy#getContext
  - org.acegisecurity.context.ThreadLocalSecurityContextHolderStrategy#setContext

- path: hudson
  exclude:
  - hudson.ExpressionFactory2#createExpression
  - hudson.ExpressionFactory2$JellyJexlContext#getVars
  - hudson.ExpressionFactory2$JellyMap#get
  - hudson.ExpressionFactory2$JexlExpression#evaluate
...
- path: jenkins
  exclude:
  - jenkins.MetaLocaleDrivenResourceProvider#lookup
  - jenkins.model.Jenkins#getACL
  - jenkins.model.Jenkins#getAuthorizationStrategy
  - jenkins.model.Jenkins#getCrumbIssuer
...
```


where the `exclude` sections should contain all the appropriate exclusions from
`exclusions.yml`.
    
With the configuration in place, rerun the tests and see the results:

```
% mvn test  -Dtest=NodeCanTakeTaskTest
...
% ls -lsh tmp/appmap | sort -n
total 11176
 776 -rw-r--r--  1 ajp  staff   329K Nov 11 10:41 hudson_model_DirectlyModifiableViewTest_doRemoveJobFromView.appmap.json
 776 -rw-r--r--  1 ajp  staff   370K Nov 11 10:41 hudson_model_DirectlyModifiableViewTest_doAddJobToView.appmap.json
1416 -rw-r--r--  1 ajp  staff   693K Nov 11 10:41 hudson_model_DirectlyModifiableViewTest_manipulateViewContent.appmap.json
4104 -rw-r--r--  1 ajp  staff   1.3M Nov 11 10:41 hudson_model_DirectlyModifiableViewTest_doAddNestedJobToRecursiveView.appmap.json
4104 -rw-r--r--  1 ajp  staff   1.8M Nov 11 10:41 hudson_model_DirectlyModifiableViewTest_failWebMethodForIllegalRequest.appmap.json
```

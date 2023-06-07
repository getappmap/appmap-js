<template>
  <section>
    <p class="mb20 bold">
      Use the <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap" button
      to start your run configurations with AppMap enabled.
    </p>
    <p>
      Using "Start with AppMap" ensures that your Java code runs with the JVM option
      <tt>-Djavaagent=appmap-agent.jar</tt>. This option is required to enable AppMap recording.
    </p>
    <template v-if="testFramework">
      <h3>Tests recording</h3>
      <p>
        When you run your JUnit tests with the AppMap <tt>javaagent</tt> JVM argument, an AppMap
        will be created for each test.
      </p>
      <p>
        Right-click on any test class or package, and choose
        <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap".
      </p>
      <p>
        For more information, visit
        <a
          href="https://appmap.io/docs/reference/jetbrains.html#create-appmaps-from-junit-test-runs"
          target="_blank"
          >AppMap docs - IntelliJ Tests recording</a
        >.
      </p>
    </template>
    <template v-else>
      <VTestsPrompt frameworks="JUnit" />
    </template>
    <template v-if="webFramework">
      <h3>Remote recording</h3>
      <p>
        When your application uses {{ this.webFramework.name }}, and you run your application with
        the AppMap <tt>javaagent</tt> JVM argument, remote recording is enabled. To make a remote
        recording, run your application using
        <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". Then use the
        "Record" button to start recording. Interact with your application, through its user
        interface and/or by making API requests using a tool such as Postman. When you are done,
        click the "Record" button again to stop the recording and view the AppMap.
      </p>
      <p>
        For more information, visit
        <a
          href="https://appmap.io/docs/reference/jetbrains.html#running-a-java-application-with-appmap"
          target="_blank"
          >AppMap docs - IntelliJ Remote recording</a
        >.
      </p>
    </template>
    <template v-else>
      <div style="color: #999">
        <h3>Remote recording</h3>

        Did you know? When you run a Spring app, you can make AppMaps of all the HTTP requests
        served by your app. Spring wasn't detected in this project, though.
      </div>
    </template>
    <section>
      <h3>Process recording</h3>
      <p>
        AppMap can record an entire Java process from start to finish. To use process recording, run
        your application using
        <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". When your
        application exits, the AppMap will be saved and opened. Visit
        <a
          href="https://appmap.io/docs/reference/appmap-java.html#process-recording"
          target="_blank"
          >AppMap Docs - Java Process recording</a
        >
        for more information.
      </p>
    </section>
    <section>
      <h3>Runnable recording</h3>
      <p>
        You can use the AppMap Java library directly to record a specific span of code. With this
        method, you can control exactly what code is recorded, and where the recording is saved. To
        use runnable recording, add an AppMap code snippet to the section of code you want to
        record, then run your application using
        <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". Visit
        <a
          href="https://appmap.io/docs/reference/appmap-java.html#runnable-recording"
          target="_blank"
          >AppMap Docs - Java Runnable recording</a
        >
        for more information.
      </p>
    </section>
  </section>
</template>
<script>
import VRunConfigDark from '@/assets/jetbrains_run_config_execute_dark.svg';
import VRunConfigLight from '@/assets/jetbrains_run_config_execute.svg';
import VTestsPrompt from './TestsPrompt.vue';

export default {
  name: 'IntelliJ',

  props: {
    webFramework: Object,
    testFramework: Object,
    theme: String,
  },

  components: {
    VRunConfigDark,
    VRunConfigLight,
    VTestsPrompt,
  },

  computed: {
    runConfigIcon() {
      return this.theme === 'dark' ? VRunConfigDark : VRunConfigLight;
    },
  },
};
</script>

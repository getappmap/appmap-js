<template>
  <section>
    <p>
      Use the <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap" option
      from the "Run" menu to start your run configurations with AppMap enabled.
    </p>
    <br />
    <p>
      Using "Start with AppMap" ensures that your Java code runs with the JVM option
      <code class="inline">-Djavaagent=appmap-agent.jar</code>. This option is required to enable
      AppMap recording.
    </p>
    <br />
    <div id="IntelliJ-screenshot"><img src="../../../assets/run-with-appmap-menu-item.png" /></div>
    <br />
    <h2>Choose the best recording method for this project</h2>
    <br />
    <template v-if="testFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><TestsIcon /></i>Tests recording<span class="recommended-badge"
            >recommended</span
          >
        </h3>
        <p>
          When you run your JUnit tests with the AppMap <code class="inline">javaagent</code> JVM
          argument, an AppMap will be created for each test.
        </p>
        <p>
          Right-click on any test class or package, and choose
          <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". This will
          add the required JVM argument to enable AppMap recording.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/jetbrains.html#create-appmaps-from-junit-test-runs"
            target="_blank"
            >AppMap docs - IntelliJ Tests recording</a
          >.
        </p>
      </section>
      <br />
    </template>
    <template v-else> <VTestsPrompt frameworks="JUnit" /><br /> </template>
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RemoteRecordingIcon /></i>Remote recording
        </h3>
        <p>
          When your application uses {{ this.webFramework.name }}, and you run your application with
          the AppMap <code class="inline">javaagent</code> JVM argument, remote recording is
          enabled. To make a remote recording, run your application using
          <component :is="runConfigIcon" class="run-config-icon" /> "Start with AppMap". Then use
          the "Record" button to start recording. Interact with your application, through its user
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
      </section>
    </template>
    <template v-else>
      <div class="recording-method recording-method--disabled">
        <h3>
          <i class="header-icon header-icon--disabled"><RemoteRecordingIcon /></i>Remote recording
        </h3>
        <p>
          Did you know? When you run a Spring app, you can make AppMaps of all the HTTP requests
          served by your app. Spring wasn't detected in this project, though.
        </p>
      </div> </template
    ><br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><ProcessIcon /></i>Process recording
      </h3>
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
    <br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><PlayIcon /></i>Runnable recording
      </h3>
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
import TestsIcon from '@/assets/tests-icon.svg';
import RemoteRecordingIcon from '@/assets/remote-recording-icon.svg';
import ProcessIcon from '@/assets/process-icon.svg';
import PlayIcon from '@/assets/play-icon.svg';
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
    PlayIcon,
    ProcessIcon,
    RemoteRecordingIcon,
    TestsIcon,
  },

  computed: {
    runConfigIcon() {
      return this.theme === 'dark' ? VRunConfigDark : VRunConfigLight;
    },
  },
};
</script>

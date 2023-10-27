<template>
  <section>
    <p>
      Use the "Run with AppMap" debug configuration to launch your application or run your tests
      through Microsoft's Test Runner for Java extension.
    </p>
    <br />
    <p>
      This ensures that your Java code runs with the JVM option
      <code class="inline">-javaagent:~/.appmap/lib/java/appmap.jar</code>. This option is required
      to enable AppMap recording.
    </p>
    <br />
    <div class="vscode-screenshot">
      <img src="../../../assets/vscode-java.gif" />
    </div>
    <br />
    <h2>Choose the best recording method for this project</h2>
    <br />
    <template v-if="testFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><TestsIcon /></i>
          Tests recording
          <span class="recommended-badge">recommended</span>
        </h3>
        <p>
          When you run your {{ testFramework.name }} tests with the AppMap
          <code class="inline">javaagent</code> JVM argument, an AppMap will be created for each
          test.
        </p>
        <p>
          This will automatically be configured for you by running your tests via the "Testing"
          button available in the sidebar or by pressing F1 and running the
          <code class="inline">Test: Run All Tests</code> command.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/vscode.html#create-appmaps-from-junit-test-runs"
            target="_blank"
          >
            AppMap docs - VSCode Tests recording
          </a>
        </p>
      </section>
      <br />
    </template>
    <template v-else>
      <VTestsPrompt framework="JUnit or TestNG" />
      <br />
    </template>
    <template v-if="webFramework">
      <section class="recording-method">
        <h3>
          <i class="header-icon"><RemoteRecordingIcon /></i>
          Remote recording
        </h3>
        <p>
          When your application uses {{ this.webFramework.name }}, and you run your application with
          the AppMap <code class="inline">javaagent</code> JVM argument, remote recording is
          enabled. To make a remote recording, run your application using the "Run with AppMap"
          debug configuration with AppMap. Then use the "Record" button to start recording. Interact
          with your application, through its user interface and/or by making API requests using a
          tool such as Postman. When you are done, click the "Record" button again to save the
          recording and view the AppMap.
        </p>
        <p>
          For more information, visit
          <a
            href="https://appmap.io/docs/reference/vscode.html#running-a-java-application-with-appmap"
            target="_blank"
            >AppMap docs - VSCode Remote recording</a
          >
        </p>
      </section>
    </template>
    <template v-else>
      <div class="recording-method recording-method--disabled">
        <h3>
          <i class="header-icon header-icon--disabled"><RemoteRecordingIcon /></i>
          Remote recording
        </h3>
        <p>
          Did you know? When you run a Spring app, you can make AppMaps of all the HTTP requests
          served by your app. Spring wasn't detected in this project, though.
        </p>
      </div>
    </template>
    <br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><ProcessIcon /></i>Process recording
      </h3>
      <p>
        AppMap can record an entire Java process from start to finish. To use process recording,
        modify <code class="inline">.vscode/launch.json</code> to include
        <code class="inline">-Dappmap.recording.auto=true</code> in
        <code class="inline">vmArgs</code>. After running this configuration, an AppMap will be
        saved once your application exits.
      </p>
      <p>
        Visit
        <a
          href="https://appmap.io/docs/reference/appmap-java.html#process-recording"
          target="_blank"
        >
          AppMap Docs - Java Process recording
        </a>
        for more information.
      </p>
    </section>
    <br />
    <section class="recording-method">
      <h3>
        <i class="header-icon"><PlayIcon /></i>
        Code Block recording
      </h3>
      <p>
        You can use the AppMap Java library directly to record a specific span of code. With this
        method, you can control exactly what code is recorded, and where the recording is saved. To
        use code block recording, add an AppMap code snippet to the section of code you want to
        record, then run your application using the Debug Configuration with AppMap.
      </p>
      <p>
        Visit
        <a
          href="https://appmap.io/docs/reference/appmap-java.html#code-block-recording"
          target="_blank"
        >
          AppMap Docs - Java Code Block recording
        </a>
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
import VTestsPrompt from './TestsPrompt.vue';

export default {
  name: 'JavaRecordInstructions',

  props: {
    webFramework: Object,
    testFramework: Object,
  },

  components: {
    VTestsPrompt,
    PlayIcon,
    ProcessIcon,
    RemoteRecordingIcon,
    TestsIcon,
  },
};
</script>

<style scoped>
.vscode-screenshot {
  text-align: center;
  max-width: 100%;
  padding: 1rem;
  border-radius: 10px;
  background-color: #343e5a;
  & > img {
    /* add drop shadow */
    box-shadow: 10px 10px 10px rgba(0, 0, 0, 0.5);
  }
}
</style>

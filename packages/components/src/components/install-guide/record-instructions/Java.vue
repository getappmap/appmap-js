<template>
  <section>
    <h3>Getting started</h3>
    <p>
      Use the "Run with AppMap" debug configuration to launch your application or run your tests
      through Microsoft's Test Runner for Java extension.
    </p>
    <p>
      This ensures that your Java code runs with the JVM option
      <code class="inline">-javaagent:~/.appmap/lib/java/appmap.jar</code>. This option is required
      to enable AppMap recording.
    </p>
    <div class="vscode-screenshot">
      <img src="../../../assets/vscode-java.gif" />
    </div>
    <h3>Recording methods</h3>
    <p>The following recording methods are available to Java applications.</p>
    <v-recording-method-grid>
      <v-recording-method
        title="HTTP request recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#requests-recording"
        :supported="!!webFramework"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.httpRequest"
      >
        <template #icon>
          <RequestsIcon />
        </template>
        <template #supported>
          <p>
            {{ webFramework.name }} will automatically begin recording upon receiving an inbound
            HTTP request. The recording will span the entire lifetime of the request.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Spring applications, AppMap will automatically record the execution flow of your
            application as it serves inbound HTTP requests.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Remote recording"
        title-lowercase="remote recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#remote-recording"
        :supported="!!webFramework"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.remote"
      >
        <template #icon>
          <RemoteRecordingIcon />
        </template>
        <template #supported>
          <p>
            Web services running {{ webFramework.name }} can toggle recordings on and off remotely
            via an HTTP API. This is useful in cases where you need control over the lifetime of the
            recording.
          </p>
          <p>
            Use the "Record" button in the IDE to start recording. Interact with your application,
            through its user interface and/or by making API requests using a tool such as Postman.
            When you are done, click the "Record" button again to save the recording and view the
            AppMap diagrams.
          </p>
        </template>
        <template #unsupported>
          <p>
            In Spring applications, recording can optionally be toggled on and off via an HTTP API.
            This is useful in cases where control is needed over the lifetime of a recording.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Test recording"
        title-lowercase="test recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#tests-recording"
        :supported="!!testFramework"
        :default-behavior="true"
        :prompt-suggestions="promptSuggestions.test"
      >
        <template #icon>
          <TestsIcon
            :style="{ width: '1.5rem', height: '1.5rem', transform: 'translateY(0.1rem)' }"
          />
        </template>
        <template #supported>
          <p>
            When running {{ testFramework.name }} tests, AppMap will automatically start and stop
            recording for each test case. With adequate test coverage, this method can quickly
            record a broad range of your application's behavior.
          </p>
          <p>
            This will automatically be configured for you by running your tests via the "Testing"
            button available in the sidebar or by pressing F1 and running the
            <code class="inline">Test: Run All Tests</code> command.
          </p>
        </template>
        <template #unsupported>
          <p>
            Testing frameworks such as JUnit or TestNG will automatically start and stop recordings
            for each test case. With adequate test coverage, this method can quickly record a broad
            range of the application's behavior.
          </p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Code block recording"
        title-lowercase="code block recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#code-block-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.codeBlock"
      >
        <template #icon>
          <CodeBlockIcon />
        </template>
        <template #supported>
          <p>
            Use the <code class="inline">com.appland.appmap.record.Recording</code> class to record
            specific spans of code.
          </p>
          <p>
            Note that this method still requires your application be run with the AppMap Java agent
            for recording to be enabled.
          </p>
          <p>Visit the documentation for examples.</p>
        </template>
      </v-recording-method>
      <v-recording-method
        title="Process recording"
        title-lowercase="process recording"
        documentation-url="https://appmap.io/docs/reference/appmap-java.html#process-recording"
        :supported="true"
        :default-behavior="false"
        :prompt-suggestions="promptSuggestions.process"
      >
        <template #icon>
          <ProcessIcon :style="{ width: '1.25rem', height: '1.25rem' }" />
        </template>
        <template #supported>
          <p>
            AppMap can record the entire process lifetime from start to finish. To enable this
            behavior, set the Java system property
            <code class="inline">appmap.recording.auto=true</code>.
          </p>
          <p>
            For example, you can modify <code class="inline">.vscode/launch.json</code> to include
            <code class="inline">-Dappmap.recording.auto=true</code> in
            <code class="inline">vmArgs</code>. When running this configuration, an AppMap recording
            will be saved after your application exits.
          </p>
        </template>
      </v-recording-method>
    </v-recording-method-grid>
  </section>
</template>
<script>
import RequestsIcon from '@/assets/request-arrows-icon.svg';
import RemoteRecordingIcon from '@/assets/remote-recording-icon.svg';
import CodeBlockIcon from '@/assets/code-block-icon.svg';
import TestsIcon from '@/assets/record-test.svg';
import ProcessIcon from '@/assets/record-process.svg';
import VRecordingMethod from './RecordingMethod.vue';
import VRecordingMethodGrid from './RecordingMethodGrid.vue';
import buildPrompts from '@/lib/buildPrompts';

export default {
  name: 'JavaRecordInstructions',

  props: {
    webFramework: Object,
    testFramework: Object,
    editor: String,
  },

  components: {
    ProcessIcon,
    RemoteRecordingIcon,
    RequestsIcon,
    CodeBlockIcon,
    TestsIcon,
    VRecordingMethod,
    VRecordingMethodGrid,
  },

  data() {
    return {
      promptSuggestions: buildPrompts(
        'Java',
        this.editor,
        this.webFramework?.name,
        this.testFramework?.name
      ),
    };
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
